import { authedProcedure, router } from "../trpc";
import { z } from "zod";

export const chatsRouter = router({
  listByProject: authedProcedure.input(z.object({ projectId: z.string().uuid() })).query(async ({ ctx, input }) => {
    const chats = await ctx.prisma.db.chat.findMany({
      where: { projectId: input.projectId, deletedAt: null },
      include: { messages: { orderBy: { ts: "asc" } } },
    });
    return chats.map(toChatDto);
  }),

  get: authedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const chat = await ctx.prisma.db.chat.findFirst({
      where: { id: input.id, deletedAt: null },
      include: { messages: { orderBy: { ts: "asc" } } },
    });
    if (!chat) throw new Error("Chat not found");
    return toChatDto(chat);
  }),

  create: authedProcedure
    .input(z.object({ projectId: z.string().uuid(), title: z.string().optional(), folderId: z.string().uuid().nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      const chat = await ctx.prisma.db.chat.create({
        data: {
          projectId: input.projectId,
          title: input.title ?? "New chat",
          folderId: input.folderId ?? null,
        },
        include: { messages: true },
      });
      return toChatDto(chat);
    }),

  update: authedProcedure
    .input(z.object({ id: z.string().uuid(), data: z.record(z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      const chat = await ctx.prisma.db.chat.update({
        where: { id: input.id },
        data: {
          ...(typeof input.data.title === "string" && { title: input.data.title }),
          ...(typeof input.data.archived === "boolean" && { archived: input.data.archived }),
        },
        include: { messages: { orderBy: { ts: "asc" } } },
      });
      return toChatDto(chat);
    }),

  delete: authedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    await ctx.prisma.db.chat.update({ where: { id: input.id }, data: { deletedAt: new Date() } });
    return { ok: true as const };
  }),

  appendMessage: authedProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
        message: z.object({ role: z.enum(["user", "assistant"]), text: z.string(), meta: z.boolean().optional() }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.db.message.create({
        data: {
          chatId: input.chatId,
          role: input.message.role,
          text: input.message.text,
          isMeta: input.message.meta ?? false,
        },
      });
      const chat = await ctx.prisma.db.chat.findUniqueOrThrow({
        where: { id: input.chatId },
        include: { messages: { orderBy: { ts: "asc" } } },
      });
      return toChatDto(chat);
    }),
});

function toChatDto(chat: {
  id: string;
  projectId: string;
  folderId: string | null;
  title: string;
  archived: boolean;
  system: string;
  persona: string;
  model: string;
  pinned: boolean;
  favorite: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  messages: { id: string; role: string; text: string; isMeta: boolean; ts: Date }[];
}) {
  return {
    id: chat.id,
    projectId: chat.projectId,
    folderId: chat.folderId,
    title: chat.title,
    archived: chat.archived,
    system: chat.system,
    persona: chat.persona,
    model: chat.model,
    pinned: chat.pinned,
    favorite: chat.favorite,
    tags: chat.tags,
    createdAt: chat.createdAt.getTime(),
    updatedAt: chat.updatedAt.getTime(),
    messages: chat.messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      text: m.text,
      ts: m.ts.getTime(),
      meta: m.isMeta || undefined,
    })),
  };
}
