/* =========================================================================
   synapse · store — kinds
   The generic collection descriptor keyed by item KIND. Keeps every panel and
   the store API tiny: one table maps a kind to its collection, label, icon,
   title field and a body extractor used for search snippets.
   ========================================================================= */
import type { IconName } from "@/design/icons";
import type { AnyItem, Chat, FileItem, Memory, Note, Prompt, Task } from "./types";

export type CollKey = "chats" | "files" | "notes" | "tasks" | "prompts" | "memory";

export interface KindDescriptor {
  coll: CollKey;
  label: string;
  one: string;
  icon: IconName;
  title: string;
  body: (o: AnyItem) => string;
}

export const KINDS: Record<string, KindDescriptor> = {
  chat: {
    coll: "chats",
    label: "Chat",
    one: "chat",
    icon: "chat",
    title: "title",
    body: (o) => ((o as Chat).messages || []).map((m) => m.text).join(" "),
  },
  file: {
    coll: "files",
    label: "File",
    one: "file",
    icon: "file",
    title: "name",
    body: (o) => (o as FileItem).content || "",
  },
  note: {
    coll: "notes",
    label: "Note",
    one: "note",
    icon: "notes",
    title: "title",
    body: (o) => (o as Note).content || "",
  },
  task: {
    coll: "tasks",
    label: "Task",
    one: "task",
    icon: "tasks",
    title: "title",
    body: (o) => (o as Task).notes || "",
  },
  prompt: {
    coll: "prompts",
    label: "Prompt",
    one: "prompt",
    icon: "prompts",
    title: "title",
    body: (o) => (o as Prompt).body || "",
  },
  memory: {
    coll: "memory",
    label: "Memory",
    one: "memory",
    icon: "memory",
    title: "title",
    body: (o) => (o as Memory).body || "",
  },
};

export const PROJECT_COLORS: Record<string, string> = {
  violet: "#8b5cf6",
  blue: "#3b82f6",
  green: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  cyan: "#06b6d4",
  slate: "#64748b",
};

export const ACCENTS: Record<string, [string, string]> = {
  violet: ["#8b5cf6", "#7c3aed"],
  blue: ["#3b82f6", "#2563eb"],
  green: ["#10b981", "#059669"],
  amber: ["#f59e0b", "#d97706"],
  rose: ["#f43f5e", "#e11d48"],
  cyan: ["#06b6d4", "#0891b2"],
};
