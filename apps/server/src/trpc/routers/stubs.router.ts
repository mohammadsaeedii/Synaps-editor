import { authedProcedure, router } from "../trpc";
import { z } from "zod";

const stub = router({
  listByProject: authedProcedure.input(z.object({ projectId: z.string().uuid() })).query(() => []),
  create: authedProcedure.input(z.object({ projectId: z.string().uuid() })).mutation(() => ({ id: "" })),
  update: authedProcedure.input(z.object({ id: z.string().uuid(), data: z.record(z.unknown()) })).mutation(() => ({})),
  delete: authedProcedure.input(z.object({ id: z.string().uuid() })).mutation(() => ({ ok: true as const })),
});

export const tasksRouter = stub;
export const notesRouter = stub;
export const promptsRouter = stub;
export const memoryRouter = stub;

export const agentsRouter = router({
  listByProject: authedProcedure.input(z.object({ projectId: z.string().uuid() })).query(() => []),
  run: authedProcedure
    .input(z.object({ agentId: z.string().uuid(), goal: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const run = await ctx.prisma.db.agentRun.create({
        data: { agentId: input.agentId, goal: input.goal, status: "running" },
      });
      await ctx.queue.enqueueAgentRun({
        runId: run.id,
        agentId: input.agentId,
        userId: ctx.user.id,
        goal: input.goal,
      });
      return { runId: run.id };
    }),
  cancel: authedProcedure.input(z.object({ runId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    await ctx.prisma.db.agentRun.update({ where: { id: input.runId }, data: { status: "stopped", endedAt: new Date() } });
    return { ok: true as const };
  }),
});

export const activityRouter = router({
  list: authedProcedure
    .input(z.object({ projectId: z.string().uuid().optional(), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.db.activity.findMany({
        where: { userId: ctx.user.id, ...(input.projectId && { projectId: input.projectId }) },
        orderBy: { ts: "desc" },
        take: input.limit,
      });
    }),
});

export const searchRouter = router({
  global: authedProcedure.input(z.object({ q: z.string(), projectId: z.string().uuid().optional(), limit: z.number().default(20) })).query(async ({ ctx, input }) => {
    // FTS via raw SQL — placeholder returns empty until Phase 2
    void ctx;
    void input;
    return [];
  }),
});

export const syncRouter = router({
  importLocalStorage: authedProcedure.input(z.object({ payload: z.string() })).mutation(async () => ({
    imported: 0,
    skipped: 0,
  })),
  pull: authedProcedure.input(z.object({ since: z.number() })).mutation(async () => ({
    revision: Date.now(),
    patch: {},
  })),
});
