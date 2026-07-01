/**
 * tRPC router type contract — implemented in apps/server, consumed by apps/client.
 * Import AppRouter from server at build time via path alias or package export.
 */

import type { z } from "zod";
import type {
  activitySchema,
  chatSchema,
  fileSchema,
  folderSchema,
  memorySchema,
  noteSchema,
  projectSchema,
  promptSchema,
  searchQuerySchema,
  taskSchema,
} from "../schemas";

type Inferred<T> = T extends { _output: infer O } ? O : never;

/** Standard CRUD list response with cursor pagination. */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Optimistic sync envelope — client sends local revision, server returns delta. */
export interface SyncDelta<T> {
  upserted: T[];
  deleted: string[];
  serverRevision: number;
}

export interface TrpcRouterContract {
  identity: {
    me: { input: void; output: { id: string; email: string; name: string | null } };
    updateSettings: {
      input: Partial<{
        theme: string;
        accent: string;
        model: string;
        systemPrompt: string;
      }>;
      output: void;
    };
  };
  projects: {
    list: { input: { cursor?: string; limit?: number }; output: Paginated<z.infer<typeof projectSchema>> };
    get: { input: { id: string }; output: z.infer<typeof projectSchema> };
    create: { input: Omit<z.infer<typeof projectSchema>, "id" | "createdAt" | "updatedAt">; output: z.infer<typeof projectSchema> };
    update: { input: { id: string; data: Partial<z.infer<typeof projectSchema>> }; output: z.infer<typeof projectSchema> };
    delete: { input: { id: string }; output: { ok: true } };
    reorder: { input: { order: string[] }; output: void };
  };
  folders: {
    listByProject: { input: { projectId: string }; output: z.infer<typeof folderSchema>[] };
    create: { input: Omit<z.infer<typeof folderSchema>, "id">; output: z.infer<typeof folderSchema> };
    update: { input: { id: string; data: Partial<z.infer<typeof folderSchema>> }; output: z.infer<typeof folderSchema> };
    delete: { input: { id: string }; output: { ok: true } };
  };
  files: {
    listByProject: { input: { projectId: string }; output: z.infer<typeof fileSchema>[] };
    get: { input: { id: string }; output: z.infer<typeof fileSchema> };
    create: { input: Omit<z.infer<typeof fileSchema>, "id" | "createdAt" | "updatedAt">; output: z.infer<typeof fileSchema> };
    update: { input: { id: string; data: Partial<z.infer<typeof fileSchema>> }; output: z.infer<typeof fileSchema> };
    delete: { input: { id: string }; output: { ok: true } };
    sync: { input: { projectId: string; since: number }; output: SyncDelta<z.infer<typeof fileSchema>> };
  };
  chats: {
    listByProject: { input: { projectId: string }; output: z.infer<typeof chatSchema>[] };
    get: { input: { id: string }; output: z.infer<typeof chatSchema> };
    create: { input: Omit<z.infer<typeof chatSchema>, "id" | "createdAt" | "updatedAt" | "messages">; output: z.infer<typeof chatSchema> };
    update: { input: { id: string; data: Partial<z.infer<typeof chatSchema>> }; output: z.infer<typeof chatSchema> };
    delete: { input: { id: string }; output: { ok: true } };
    appendMessage: {
      input: { chatId: string; message: { role: "user" | "assistant"; text: string; meta?: boolean } };
      output: z.infer<typeof chatSchema>;
    };
  };
  tasks: {
    listByProject: { input: { projectId: string }; output: z.infer<typeof taskSchema>[] };
    create: { input: Omit<z.infer<typeof taskSchema>, "id" | "createdAt" | "updatedAt">; output: z.infer<typeof taskSchema> };
    update: { input: { id: string; data: Partial<z.infer<typeof taskSchema>> }; output: z.infer<typeof taskSchema> };
    delete: { input: { id: string }; output: { ok: true } };
  };
  notes: {
    listByProject: { input: { projectId: string }; output: z.infer<typeof noteSchema>[] };
    create: { input: Omit<z.infer<typeof noteSchema>, "id" | "createdAt" | "updatedAt">; output: z.infer<typeof noteSchema> };
    update: { input: { id: string; data: Partial<z.infer<typeof noteSchema>> }; output: z.infer<typeof noteSchema> };
    delete: { input: { id: string }; output: { ok: true } };
  };
  prompts: {
    listByProject: { input: { projectId: string }; output: z.infer<typeof promptSchema>[] };
    create: { input: Omit<z.infer<typeof promptSchema>, "id" | "createdAt" | "updatedAt">; output: z.infer<typeof promptSchema> };
    update: { input: { id: string; data: Partial<z.infer<typeof promptSchema>> }; output: z.infer<typeof promptSchema> };
    delete: { input: { id: string }; output: { ok: true } };
  };
  memory: {
    listByProject: { input: { projectId: string }; output: z.infer<typeof memorySchema>[] };
    create: { input: Omit<z.infer<typeof memorySchema>, "id" | "createdAt" | "updatedAt">; output: z.infer<typeof memorySchema> };
    update: { input: { id: string; data: Partial<z.infer<typeof memorySchema>> }; output: z.infer<typeof memorySchema> };
    delete: { input: { id: string }; output: { ok: true } };
  };
  agents: {
    listByProject: { input: { projectId: string }; output: unknown[] };
    run: { input: { agentId: string; goal: string }; output: { runId: string } };
    cancel: { input: { runId: string }; output: { ok: true } };
  };
  activity: {
    list: { input: { projectId?: string; limit?: number }; output: z.infer<typeof activitySchema>[] };
  };
  search: {
    global: { input: z.infer<typeof searchQuerySchema>; output: unknown[] };
  };
  sync: {
    importLocalStorage: { input: { payload: string }; output: { imported: number; skipped: number } };
    pull: { input: { since: number }; output: { revision: number; patch: unknown } };
  };
}
