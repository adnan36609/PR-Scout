import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { inngest } from "@/server/inngest";
import {
  fetchPullRequest,
  getGitHubAccessToken,
} from "@/server/services/github";
import { queueReview } from "@/server/services/review-queue";

export const reviewRouter = createTRPCRouter({
  trigger: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        prNumber: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findUnique({
        where: { id: input.repositoryId, userId: ctx.user.id },
      });

      if (!repository) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
      }

      const accessToken = await getGitHubAccessToken(ctx.user.id);
      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub account not connected",
        });
      }

      const [owner, repo] = repository.fullName.split("/");
      if (!owner || !repo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid repository name",
        });
      }

      const pr = await fetchPullRequest(
        accessToken,
        owner,
        repo,
        input.prNumber,
      );

      const review = await queueReview({
        repositoryId: repository.id,
        userId: ctx.user.id,
        prNumber: pr.number,
        prTitle: pr.title,
        prUrl: pr.html_url,
        headSha: pr.head.sha,
        baseSha: pr.base.sha,
      });

      return { reviewId: review.reviewId };
    }),
  cancel: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.review.findUnique({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // A completed, failed, or already cancelled review cannot be stopped.
      if (review.status !== "PENDING" && review.status !== "PROCESSING") {
        return {
          cancelled: false,
          status: review.status,
          cancellationEventSent: false,
        };
      }

      // Atomically mark the review as cancelled, but only if it is
      // still active. This avoids overwriting a concurrent completion.
      const result = await ctx.db.review.updateMany({
        where: {
          id: review.id,
          userId: ctx.user.id,
          status: {
            in: ["PENDING", "PROCESSING"],
          },
        },
        data: {
          status: "CANCELLED",
          error: "Cancelled by user",
          activeKey: null,
        },
      });

      if (result.count === 0) {
        const currentReview = await ctx.db.review.findUnique({
          where: {
            id: review.id,
            userId: ctx.user.id,
          },
          select: {
            status: true,
          },
        });

        return {
          cancelled: false,
          status: currentReview?.status ?? review.status,
          cancellationEventSent: false,
        };
      }

      let cancellationEventSent = true;

      try {
        await inngest.send({
          name: "review/pr.cancelled",
          data: {
            reviewId: review.id,
          },
        });
      } catch (error) {
        cancellationEventSent = false;

        console.error("Failed to send review cancellation event", {
          reviewId: review.id,
          error,
        });
      }

      return {
        cancelled: true,
        status: "CANCELLED" as const,
        cancellationEventSent,
      };
    }),
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const review = await ctx.db.review.findUnique({
        where: { id: input.id, userId: ctx.user.id },
        include: { repository: true },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      return review;
    }),
  list: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const reviews = await ctx.db.review.findMany({
        where: {
          userId: ctx.user.id,
          ...(input.repositoryId && { repositoryId: input.repositoryId }),
        },
        include: { repository: true },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      return reviews;
    }),
  getLatestForPR: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        prNumber: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const review = await ctx.db.review.findFirst({
        where: {
          repositoryId: input.repositoryId,
          prNumber: input.prNumber,
          userId: ctx.user.id,
        },
        orderBy: { createdAt: "desc" },
      });

      return review;
    }),
});
