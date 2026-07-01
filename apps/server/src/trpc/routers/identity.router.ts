import { authedProcedure, router } from "../trpc";
import { z } from "zod";

export const identityRouter = router({
  me: authedProcedure.query(({ ctx }) => ({
    id: ctx.user.id,
    email: ctx.user.email,
    name: null as string | null,
  })),

  updateSettings: authedProcedure
    .input(
      z.object({
        theme: z.string().optional(),
        accent: z.string().optional(),
        model: z.string().optional(),
        systemPrompt: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.db.userSettings.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          theme: input.theme ?? "dark",
          accent: input.accent ?? "violet",
          defaultModel: input.model ?? "claude-opus-4-8",
          systemPrompt: input.systemPrompt ?? "",
        },
        update: {
          ...(input.theme && { theme: input.theme }),
          ...(input.accent && { accent: input.accent }),
          ...(input.model && { defaultModel: input.model }),
          ...(input.systemPrompt !== undefined && { systemPrompt: input.systemPrompt }),
        },
      });
    }),
});
