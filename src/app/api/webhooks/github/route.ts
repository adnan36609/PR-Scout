import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/server/db";
import { queueReview } from "@/server/services/review-queue";

const PullRequestPayloadSchema = z.object({
  action: z.string().min(1),

  pull_request: z.object({
    number: z.number().int().positive(),
    title: z.string(),
    html_url: z.string().url(),
    draft: z.boolean(),
    head: z.object({
      sha: z.string().min(1),
    }),
    base: z.object({
      sha: z.string().min(1),
    }),
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

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[GitHub Webhook] Secret is not configured");

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

  if (!verifySignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!event || !deliveryId) {
    return NextResponse.json(
      { error: "Missing GitHub webhook headers" },
      { status: 400 },
    );
  }

  // Persist events that PR Scout does not process.
  // This also prevents repeated processing of the same delivery.
  if (event !== "pull_request") {
    try {
      await db.gitHubWebhookDelivery.create({
        data: {
          deliveryId,
          event,
          status: "IGNORED",
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        console.error("[GitHub Webhook] Failed to record ignored event", {
          deliveryId,
          error,
        });

        return NextResponse.json(
          { error: "Failed to record webhook delivery" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
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

  const validation = PullRequestPayloadSchema.safeParse(parsedPayload);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid pull request payload" },
      { status: 400 },
    );
  }

  const data = validation.data;

  let delivery;

  try {
    // Create the delivery record once.
    // A unique constraint prevents duplicate delivery records.
    try {
      delivery = await db.gitHubWebhookDelivery.create({
        data: {
          deliveryId,
          event,
          action: data.action,
          repositoryGithubId: data.repository.id,
          prNumber: data.pull_request.number,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      delivery = await db.gitHubWebhookDelivery.findUnique({
        where: { deliveryId },
      });

      if (!delivery) {
        throw error;
      }
    }

    // Completed or ignored deliveries must not run again.
    if (delivery.status === "QUEUED" || delivery.status === "IGNORED") {
      return NextResponse.json(
        {
          message: "Delivery already processed",
          reviewId: delivery.reviewId,
        },
        { status: 200 },
      );
    }

    // Recover abandoned PROCESSING deliveries after five minutes.
    const staleBefore = new Date(Date.now() - 5 * 60 * 1000);

    const claimed = await db.gitHubWebhookDelivery.updateMany({
      where: {
        id: delivery.id,
        OR: [
          {
            status: {
              in: ["RECEIVED", "FAILED"],
            },
          },
          {
            status: "PROCESSING",
            OR: [
              { lastAttemptAt: { lt: staleBefore } },
              { lastAttemptAt: null },
            ],
          },
        ],
      },
      data: {
        status: "PROCESSING",
        attempts: {
          increment: 1,
        },
        lastAttemptAt: new Date(),
        error: null,
      },
    });

    if (claimed.count === 0) {
      const currentDelivery = await db.gitHubWebhookDelivery.findUnique({
        where: { deliveryId },
      });

      return NextResponse.json(
        {
          message: "Delivery is already being processed",
          status: currentDelivery?.status,
          reviewId: currentDelivery?.reviewId,
        },
        { status: 200 },
      );
    }

    const supportedActions = [
      "opened",
      "synchronize",
      "reopened",
      "ready_for_review",
    ];

    if (!supportedActions.includes(data.action)) {
      await db.gitHubWebhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "IGNORED",
          error: null,
        },
      });

      return NextResponse.json(
        { message: `Action '${data.action}' ignored` },
        { status: 200 },
      );
    }

    if (data.pull_request.draft) {
      await db.gitHubWebhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "IGNORED",
        },
      });

      return NextResponse.json(
        { message: "Draft PR ignored" },
        { status: 200 },
      );
    }

    const repository = await db.repository.findUnique({
      where: {
        githubId: data.repository.id,
      },
    });

    if (!repository) {
      await db.gitHubWebhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "IGNORED",
        },
      });

      return NextResponse.json(
        { message: "Repository not connected" },
        { status: 200 },
      );
    }

    // Create a review or recover the review associated
    // with an earlier attempt of this same delivery.
    const review = await queueReview({
      repositoryId: repository.id,
      userId: repository.userId,
      prNumber: data.pull_request.number,
      prTitle: data.pull_request.title,
      prUrl: data.pull_request.html_url,
      headSha: data.pull_request.head.sha,
      deliveryId,
      existingReviewId: delivery.reviewId ?? undefined,
      baseSha: data.pull_request.base.sha,
    });

    await db.gitHubWebhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "QUEUED",
        reviewId: review.reviewId,
        error: null,
      },
    });

    console.info("[GitHub Webhook] Review queued", {
      deliveryId,
      reviewId: review.reviewId,
      repositoryId: repository.id,
      prNumber: data.pull_request.number,
      headSha: data.pull_request.head.sha,
      created: review.created,
    });

    return NextResponse.json(
      {
        message: review.created ? "Review triggered" : "Review already exists",
        reviewId: review.reviewId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GitHub Webhook] Processing failed", {
      deliveryId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Keep the associated review intact.
    // A subsequent delivery retry can resume queueing it.
    await db.gitHubWebhookDelivery
      .updateMany({
        where: {
          deliveryId,
          status: "PROCESSING",
        },
        data: {
          status: "FAILED",
          error: "Webhook processing failed. The delivery can be retried.",
        },
      })
      .catch((updateError) => {
        console.error("[GitHub Webhook] Failed to record delivery failure", {
          deliveryId,
          error: updateError,
        });
      });

    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}
