/* Maps a panel id (+ optional item ref) to its React component. Imported by
   the editor area and the dock; kept separate from PANEL_META (pure data). */
import type { ReactNode } from "react";
import { AgentsConsole } from "./AgentsPanel/AgentsPanel";
import { ChatPanel } from "./ChatPanel/ChatPanel";
import { FilesPanel } from "./FilesPanel/FilesPanel";
import { GitPanel } from "./GitPanel/GitPanel";
import { MemoryPanel } from "./MemoryPanel/MemoryPanel";
import { NotesPanel } from "./NotesPanel/NotesPanel";
import { OverviewPanel } from "./OverviewPanel/OverviewPanel";
import { PromptsPanel } from "./PromptsPanel/PromptsPanel";
import { SettingsPanel } from "./SettingsPanel/SettingsPanel";
import { TasksPanel } from "./TasksPanel/TasksPanel";
import { TerminalPanel } from "./TerminalPanel/TerminalPanel";

export function renderPanel(panel: string, refId: string | null): ReactNode {
  switch (panel) {
    case "chat":
      return refId ? <ChatPanel chatId={refId} /> : null;
    case "file":
      return refId ? <FilesPanel fileId={refId} /> : null;
    case "note":
      return refId ? <NotesPanel noteId={refId} /> : null;
    case "prompt":
      return refId ? <PromptsPanel promptId={refId} /> : null;
    case "memory":
      return refId ? <MemoryPanel memoryId={refId} /> : null;
    case "task":
      return <TasksPanel />;
    case "overview":
      return <OverviewPanel />;
    case "settings":
      return <SettingsPanel />;
    case "agents":
      return <AgentsConsole />;
    default:
      return null;
  }
}

export function renderDockPanel(panel: string): ReactNode {
  switch (panel) {
    case "terminal":
      return <TerminalPanel />;
    case "git":
      return <GitPanel />;
    default:
      return null;
  }
}
