import { authedProcedure, router } from "../trpc";
import { z } from "zod";

export const filesRouter = router({
  listByProject: authedProcedure.input(z.object({ projectId: z.string().uuid() })).query(async ({ ctx, input }) => {
    const files = await ctx.prisma.db.file.findMany({
      where: { projectId: input.projectId, deletedAt: null },
    });
    return files.map(toFileDto);
  }),

  get: authedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const f = await ctx.prisma.db.file.findFirst({ where: { id: input.id, deletedAt: null } });
    if (!f) throw new Error("File not found");
    return toFileDto(f);
  }),

  create: authedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        name: z.string(),
        parentId: z.string().uuid().nullable().optional(),
        dir: z.boolean().optional(),
        content: z.string().optional(),
        language: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const f = await ctx.prisma.db.file.create({
        data: {
          projectId: input.projectId,
          name: input.name,
          parentId: input.parentId ?? null,
          isDir: input.dir ?? false,
          content: input.content ?? "",
          language: input.language ?? "plaintext",
        },
      });
      return toFileDto(f);
    }),

  update: authedProcedure
    .input(z.object({ id: z.string().uuid(), data: z.record(z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      const f = await ctx.prisma.db.file.update({
        where: { id: input.id },
        data: {
          ...(typeof input.data.name === "string" && { name: input.data.name }),
          ...(typeof input.data.content === "string" && { content: input.data.content }),
        },
      });
      return toFileDto(f);
    }),

  delete: authedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    await ctx.prisma.db.file.update({ where: { id: input.id }, data: { deletedAt: new Date() } });
    return { ok: true as const };
  }),

  sync: authedProcedure
    .input(z.object({ projectId: z.string().uuid(), since: z.number() }))
    .query(async ({ ctx, input }) => {
      const since = new Date(input.since);
      const upserted = await ctx.prisma.db.file.findMany({
        where: { projectId: input.projectId, updatedAt: { gt: since } },
      });
      return {
        upserted: upserted.map(toFileDto),
        deleted: [] as string[],
        serverRevision: Date.now(),
      };
    }),
});

function toFileDto(f: {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  isDir: boolean;
  content: string;
  language: string;
  encoding: string;
  mimeType: string | null;
  size: number | null;
  pinned: boolean;
  favorite: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: f.id,
    projectId: f.projectId,
    parentId: f.parentId,
    name: f.name,
    dir: f.isDir,
    content: f.content,
    language: f.language,
    encoding: f.encoding as "text" | "base64",
    mimeType: f.mimeType ?? undefined,
    size: f.size ?? undefined,
    pinned: f.pinned,
    favorite: f.favorite,
    tags: f.tags,
    createdAt: f.createdAt.getTime(),
    updatedAt: f.updatedAt.getTime(),
  };
}
