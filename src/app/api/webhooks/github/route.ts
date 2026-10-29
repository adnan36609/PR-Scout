import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/server/db";
import { inngest } from "@/server/inngest";

const PullRequestPayloadSchema = z.object({
  action: z.string().min(1),

  pull_request: z.object({
    number: z.number().int().positive(),
    title: z.string(),
    html_url: z.string().url(),
    draft: z.boolean(),
  }),

  repository: z.object({
    id: z.number().int().positive(),
  }),
});

function verifySignature(
  payload: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !/^sha256=[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  const receivedSignature = Buffer.from(
    signature.slice("sha256=".length),
    "hex",
  );

  const expectedSignature = createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest();

  return (
    receivedSignature.length === expectedSignature.length &&
    timingSafeEqual(receivedSignature, expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[GitHub Webhook] GITHUB_WEBHOOK_SECRET is not configured");

    return NextResponse.json(
      { error: "Webhook endpoint is not configured" },
      { status: 500 },
    );
  }

  let payload: string;

  try {
    payload = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Unable to read webhook payload" },
      { status: 400 },
    );
  }

  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");
  const deliveryId = request.headers.get("x-github-delivery");

  // Verify the signature against the original request body.
  if (!verifySignature(payload, signature, secret)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 },
    );
  }

  // Ignore events unrelated to pull requests.
  if (event !== "pull_request") {
    return NextResponse.json(
      { message: "Event ignored" },
      { status: 200 },
    );
  }

  let parsedPayload: unknown;

  try {
    parsedPayload = JSON.parse(payload);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  // TypeScript interfaces do not validate untrusted JSON at runtime.
  const validation = PullRequestPayloadSchema.safeParse(parsedPayload);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid pull request payload" },
      { status: 400 },
    );
  }

  const data = validation.data;

  // Review newly opened PRs, new commits, reopened PRs,
  // and drafts that become ready for review.
  const supportedActions = [
    "opened",
    "synchronize",
    "reopened",
    "ready_for_review",
  ];

  if (!supportedActions.includes(data.action)) {
    return NextResponse.json(
      { message: `Action '${data.action}' ignored` },
      { status: 200 },
    );
  }

  // Draft PRs should not trigger an AI review.
  if (data.pull_request.draft) {
    return NextResponse.json(
      { message: "Draft PR ignored" },
      { status: 200 },
    );
  }

  try {
    // Find the repository connected to PR Scout.
    const repository = await db.repository.findUnique({
      where: {
        githubId: data.repository.id,
      },
    });

    if (!repository) {
      return NextResponse.json(
        { message: "Repository not connected" },
        { status: 200 },
      );
    }

    // Avoid starting another review while one is active.
    const existingReview = await db.review.findFirst({
      where: {
        repositoryId: repository.id,
        prNumber: data.pull_request.number,
        status: {
          in: ["PENDING", "PROCESSING"],
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          message: "Review already in progress",
          reviewId: existingReview.id,
        },
        { status: 200 },
      );
    }

    // Create a review record before sending its background event.
    const review = await db.review.create({
      data: {
        repositoryId: repository.id,
        userId: repository.userId,
        prNumber: data.pull_request.number,
        prTitle: data.pull_request.title,
        prUrl: data.pull_request.html_url,
        status: "PENDING",
      },
    });

    try {
      await inngest.send({
        id: `pr-scout-review-${review.id}`,
        name: "review/pr.requested",
        data: {
          reviewId: review.id,
          repositoryId: repository.id,
          prNumber: data.pull_request.number,
          userId: repository.userId,
        },
      });
    } catch (error) {
      console.error("[GitHub Webhook] Failed to enqueue review", {
        reviewId: review.id,
        deliveryId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Do not overwrite a review that has already started processing.
      await db.review.updateMany({
        where: {
          id: review.id,
          status: "PENDING",
        },
        data: {
          status: "FAILED",
          error: "Failed to enqueue review from GitHub webhook.",
        },
      });

      return NextResponse.json(
        { error: "Failed to enqueue review" },
        { status: 500 },
      );
    }

    console.info("[GitHub Webhook] Review queued", {
      deliveryId,
      reviewId: review.id,
      repositoryId: repository.id,
      prNumber: data.pull_request.number,
    });

    return NextResponse.json(
      {
        message: "Review triggered",
        reviewId: review.id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GitHub Webhook] Processing failed", {
      deliveryId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}