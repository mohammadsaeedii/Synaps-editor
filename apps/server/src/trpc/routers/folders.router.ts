import { authedProcedure, router } from "../trpc";
import { z } from "zod";

const folderInput = z.object({
  name: z.string(),
  projectId: z.string().uuid(),
  parentId: z.string().uuid().nullable().optional(),
});

export const foldersRouter = router({
  listByProject: authedProcedure.input(z.object({ projectId: z.string().uuid() })).query(async ({ ctx, input }) => {
    const folders = await ctx.prisma.db.folder.findMany({ where: { projectId: input.projectId } });
    return folders.map(toFolderDto);
  }),

  create: authedProcedure.input(folderInput).mutation(async ({ ctx, input }) => {
    const f = await ctx.prisma.db.folder.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        parentId: input.parentId ?? null,
      },
    });
    return toFolderDto(f);
  }),

  update: authedProcedure
    .input(z.object({ id: z.string().uuid(), data: folderInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const f = await ctx.prisma.db.folder.update({
        where: { id: input.id },
        data: input.data,
      });
      return toFolderDto(f);
    }),

  delete: authedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    await ctx.prisma.db.folder.delete({ where: { id: input.id } });
    return { ok: true as const };
  }),
});

function toFolderDto(f: { id: string; name: string; projectId: string; parentId: string | null; expanded: boolean; sortOrder: number }) {
  return {
    id: f.id,
    name: f.name,
    projectId: f.projectId,
    parentId: f.parentId,
    expanded: f.expanded,
    order: f.sortOrder,
  };
}
