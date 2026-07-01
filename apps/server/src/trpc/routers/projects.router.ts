import { authedProcedure, router } from "../trpc";
import { projectSchema } from "@synapse/shared";
import { z } from "zod";

export const projectsRouter = router({
  list: authedProcedure
    .input(z.object({ cursor: z.string().optional(), limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.db.project.findMany({
        where: { userId: ctx.user.id, deletedAt: null },
        orderBy: { sortOrder: "asc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
      const hasMore = items.length > input.limit;
      const page = hasMore ? items.slice(0, -1) : items;
      return {
        items: page.map(toProjectDto),
        nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
        hasMore,
      };
    }),

  get: authedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const p = await ctx.prisma.db.project.findFirst({
      where: { id: input.id, userId: ctx.user.id, deletedAt: null },
    });
    if (!p) throw new Error("Project not found");
    return toProjectDto(p);
  }),

  create: authedProcedure
    .input(z.object({ name: z.string(), color: z.string(), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const p = await ctx.prisma.db.project.create({
        data: {
          userId: ctx.user.id,
          name: input.name,
          color: input.color,
          description: input.description ?? "",
        },
      });
      return toProjectDto(p);
    }),

  update: authedProcedure
    .input(z.object({ id: z.string().uuid(), data: projectSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      const p = await ctx.prisma.db.project.update({
        where: { id: input.id, userId: ctx.user.id },
        data: {
          ...(input.data.name && { name: input.data.name }),
          ...(input.data.color && { color: input.data.color }),
          ...(input.data.description !== undefined && { description: input.data.description }),
          ...(input.data.pinned !== undefined && { pinned: input.data.pinned }),
        },
      });
      return toProjectDto(p);
    }),

  delete: authedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    await ctx.prisma.db.project.update({
      where: { id: input.id, userId: ctx.user.id },
      data: { deletedAt: new Date() },
    });
    return { ok: true as const };
  }),

  reorder: authedProcedure.input(z.object({ order: z.array(z.string().uuid()) })).mutation(async ({ ctx, input }) => {
    await ctx.prisma.db.$transaction(
      input.order.map((id, i) =>
        ctx.prisma.db.project.update({
          where: { id, userId: ctx.user.id },
          data: { sortOrder: i },
        }),
      ),
    );
  }),
});

function toProjectDto(p: {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: p.id,
    name: p.name,
    color: p.color,
    icon: p.icon,
    description: p.description,
    pinned: p.pinned,
    createdAt: p.createdAt.getTime(),
    updatedAt: p.updatedAt.getTime(),
  };
}
