import { pullRequestRouter } from "./routers/pull-request";
import { repositoryRouter } from "./routers/repository";
import { reviewRouter } from "./routers/review";
import { createCallerFactory, createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    return { status: "ok", timestamp: new Date() };
  }),
  repository: repositoryRouter,
  pullRequest: pullRequestRouter,
  review: reviewRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);