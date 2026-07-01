import { z } from "zod";

/* ── primitives ─────────────────────────────────────────────────────── */

export const idSchema = z.string().uuid();
export const timestampSchema = z.number().int().positive();

export const tagsSchema = z.array(z.string().max(64)).max(32);

/* ── entities ───────────────────────────────────────────────────────── */

export const projectSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(128),
  color: z.string().max(32),
  icon: z.string().max(64),
  description: z.string().max(2000),
  pinned: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const folderSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(256),
  projectId: idSchema,
  parentId: idSchema.nullable(),
  expanded: z.boolean(),
  order: z.number(),
});

export const chatMessageSchema = z.object({
  id: idSchema,
  role: z.enum(["user", "assistant"]),
  text: z.string(),
  ts: timestampSchema,
  meta: z.boolean().optional(),
});

export const chatSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  pinned: z.boolean(),
  favorite: z.boolean(),
  tags: tagsSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  title: z.string().min(1).max(512),
  folderId: idSchema.nullable(),
  archived: z.boolean(),
  system: z.string().max(32000),
  persona: z.string().max(8000),
  model: z.string().max(128),
  messages: z.array(chatMessageSchema),
});

export const fileSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  pinned: z.boolean(),
  favorite: z.boolean(),
  tags: tagsSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  name: z.string().min(1).max(512),
  parentId: idSchema.nullable(),
  dir: z.boolean(),
  content: z.string(),
  language: z.string().max(64),
  encoding: z.enum(["text", "base64"]).optional(),
  mimeType: z.string().max(128).optional(),
  size: z.number().int().nonnegative().optional(),
  expanded: z.boolean().optional(),
});

export const noteSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  pinned: z.boolean(),
  favorite: z.boolean(),
  tags: tagsSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  title: z.string().min(1).max(512),
  content: z.string(),
});

export const taskSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  pinned: z.boolean(),
  favorite: z.boolean(),
  tags: tagsSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  title: z.string().min(1).max(512),
  status: z.enum(["todo", "doing", "done"]),
  priority: z.enum(["low", "med", "high"]),
  due: timestampSchema.nullable(),
  notes: z.string(),
  order: z.number(),
});

export const promptSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  pinned: z.boolean(),
  favorite: z.boolean(),
  tags: tagsSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  title: z.string().min(1).max(512),
  body: z.string(),
  uses: z.number().int().nonnegative(),
});

export const memorySchema = z.object({
  id: idSchema,
  projectId: idSchema,
  pinned: z.boolean(),
  favorite: z.boolean(),
  tags: tagsSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  title: z.string().min(1).max(512),
  body: z.string(),
  scope: z.enum(["project", "global"]),
});

export const activitySchema = z.object({
  id: idSchema,
  action: z.string().max(64),
  kind: z.string().max(64),
  refId: idSchema,
  projectId: idSchema.nullable(),
  title: z.string().max(512),
  ts: timestampSchema,
});

/* ── AI streaming ───────────────────────────────────────────────────── */

export const aiStreamRequestSchema = z.object({
  chatId: idSchema.optional(),
  projectId: idSchema.optional(),
  model: z.string().max(128).optional(),
  system: z.string().max(32000).optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
  codeContext: z.string().max(64000).optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(256),
  projectId: idSchema.optional(),
  kinds: z
    .array(z.enum(["file", "chat", "task", "note"]))
    .optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

/* ── sync / migration ───────────────────────────────────────────────── */

export const localStorageImportSchema = z.object({
  version: z.number(),
  projects: z.record(projectSchema),
  projectOrder: z.array(idSchema),
  folders: z.record(folderSchema),
  chats: z.record(chatSchema),
  files: z.record(fileSchema),
  notes: z.record(noteSchema),
  tasks: z.record(taskSchema),
  prompts: z.record(promptSchema),
  memory: z.record(memorySchema),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type AiStreamRequest = z.infer<typeof aiStreamRequestSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
