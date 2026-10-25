import {
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
} from "./trpc";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => {
    return {
      status: "ok" as const,
      timestamp: new Date(),
    };
  }),
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);