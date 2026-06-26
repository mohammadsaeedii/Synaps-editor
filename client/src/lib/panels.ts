/* =========================================================================
   synapse · panel registry (metadata only)
   Pure data describing every panel — its title, icon, optional store kind and
   whether it is a single-instance (board-style) panel. Kept free of component
   imports so both the workspace orchestrator and the editor area can read it
   without an import cycle. The editor area maps these ids to components.
   ========================================================================= */
import type { IconName } from "@/design/icons";
import type { Kind } from "./store/types";

export type PanelWhere = "editor" | "side" | "dock";

export interface PanelMeta {
  id: string;
  title: string;
  icon: IconName;
  /** Set for per-item editor panels (chat, file, note, prompt, memory). */
  kind?: Kind;
  /** Single-instance panels open one tab and re-focus it (tasks, overview…). */
  single?: boolean;
  where: PanelWhere;
}

export const PANEL_META: Record<string, PanelMeta> = {
  chat: { id: "chat", title: "Chat", icon: "chat", kind: "chat", where: "editor" },
  file: { id: "file", title: "File", icon: "file", kind: "file", where: "editor" },
  note: { id: "note", title: "Note", icon: "notes", kind: "note", where: "editor" },
  prompt: { id: "prompt", title: "Prompt", icon: "prompts", kind: "prompt", where: "editor" },
  memory: { id: "memory", title: "Memory", icon: "memory", kind: "memory", where: "editor" },
  task: { id: "task", title: "Tasks", icon: "tasks", single: true, where: "editor" },
  overview: { id: "overview", title: "Overview", icon: "overview", single: true, where: "editor" },
  settings: { id: "settings", title: "Settings", icon: "settings", single: true, where: "editor" },
  agents: { id: "agents", title: "AI Agents", icon: "agents", single: true, where: "editor" },
};

export interface SideViewMeta {
  id: string;
  title: string;
  icon: IconName;
  hint?: string;
}

export const SIDE_VIEWS: SideViewMeta[] = [
  { id: "explorer", title: "Explorer", icon: "explorer", hint: "⇧⌘E" },
  { id: "search", title: "Search", icon: "search", hint: "⇧⌘F" },
  { id: "git", title: "Source Control", icon: "git" },
  { id: "agents", title: "AI Agents", icon: "agents" },
];

export interface DockPanelMeta {
  id: string;
  title: string;
  icon: IconName;
}

export const DOCK_PANELS: DockPanelMeta[] = [
  { id: "terminal", title: "Terminal", icon: "terminal" },
  { id: "git", title: "Source Control", icon: "git" },
];

export const tabKey = (panel: string, refId: string | null): string => panel + ":" + (refId == null ? "_" : refId);
