/**
 * Canonical domain types — single source of truth for client + server.
 * Derived from apps/client/src/lib/store/types.ts with server extensions.
 */

export type Kind = "chat" | "file" | "note" | "task" | "prompt" | "memory";

export interface BaseItem {
  id: string;
  projectId: string;
  pinned: boolean;
  favorite: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  ts: number;
  meta?: boolean;
}

export interface Chat extends BaseItem {
  title: string;
  folderId: string | null;
  archived: boolean;
  system: string;
  persona: string;
  model: string;
  messages: ChatMessage[];
}

export type FileEncoding = "text" | "base64";

export interface FileItem extends BaseItem {
  name: string;
  parentId: string | null;
  dir: boolean;
  content: string;
  language: string;
  encoding?: FileEncoding;
  mimeType?: string;
  size?: number;
  expanded?: boolean;
}

export interface Note extends BaseItem {
  title: string;
  content: string;
}

export type TaskStatus = "todo" | "doing" | "done";
export type Priority = "low" | "med" | "high";

export interface Task extends BaseItem {
  title: string;
  status: TaskStatus;
  priority: Priority;
  due: number | null;
  notes: string;
  order: number;
}

export interface Prompt extends BaseItem {
  title: string;
  body: string;
  uses: number;
}

export interface Memory extends BaseItem {
  title: string;
  body: string;
  scope: "project" | "global";
}

export type AnyItem = Chat | FileItem | Note | Task | Prompt | Memory;

export interface KindItemMap {
  chat: Chat;
  file: FileItem;
  note: Note;
  task: Task;
  prompt: Prompt;
  memory: Memory;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  projectId: string;
  parentId: string | null;
  expanded: boolean;
  order: number;
}

export interface AgentRun {
  id: string;
  goal: string;
  status: "idle" | "running" | "done" | "stopped";
  ts: number;
  log: string[];
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  status: "idle" | "running" | "done" | "stopped";
  projectId: string;
  system: string;
  createdAt: number;
  runs: AgentRun[];
}

export interface Activity {
  id: string;
  action: string;
  kind: string;
  refId: string;
  projectId: string | null;
  title: string;
  ts: number;
}

/** Server-only: user preferences (no apiKey — keys live server-side). */
export interface UserSettings {
  theme: "dark" | "light" | "system";
  accent: string;
  density: string;
  name: string;
  plan: string;
  model: string;
  systemPrompt: string;
  reduceMotion: boolean;
}

export interface SearchResult {
  id: string;
  kind: Kind | "chat" | "file" | "note" | "task";
  title: string;
  snippet: string;
  projectId: string;
  score: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  model: string;
  estimatedCostUsd?: number;
}
