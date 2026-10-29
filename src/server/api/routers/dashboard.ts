import { createTRPCRouter, protectedProcedure } from "../trpc";

export const dashboardRouter = createTRPCRouter({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const [
      repositoryCount,
      totalReviews,
      completedReviews,
      activeReviews,
      recentReviews,
    ] = await Promise.all([
      ctx.db.repository.count({
        where: { userId },
      }),

      ctx.db.review.count({
        where: { userId },
      }),

      ctx.db.review.count({
        where: {
          userId,
          status: "COMPLETED",
        },
      }),

      ctx.db.review.count({
        where: {
          userId,
          status: {
            in: ["PENDING", "PROCESSING"],
          },
        },
      }),

      ctx.db.review.findMany({
        where: { userId },
        select: {
          id: true,
          prNumber: true,
          prTitle: true,
          status: true,
          riskScore: true,
          createdAt: true,
          repository: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      }),
    ]);

    return {
      repositoryCount,
      totalReviews,
      completedReviews,
      activeReviews,
      recentReviews,
    };
  }),
});