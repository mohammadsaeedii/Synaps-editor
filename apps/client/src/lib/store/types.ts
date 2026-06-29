/* =========================================================================
   synapse · store — types
   The TypeScript shape of the v2 state tree persisted under
   localStorage["synapse:v2"]. Mirrors the original store.js exactly.
   ========================================================================= */

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

export type ThemeMode = "dark" | "light" | "system";

export interface Settings {
  theme: ThemeMode;
  accent: string;
  density: string;
  name: string;
  plan: string;
  model: string;
  apiKey: string;
  systemPrompt: string;
  reduceMotion: boolean;
}

export interface Commit {
  hash: string;
  msg: string;
  author: string;
  ts: number;
  files: string[];
}

export interface Branch {
  name: string;
  head: string | null;
}

export interface WorkingChange {
  path: string;
  status: "M" | "A" | "D" | "U";
  staged?: boolean;
}

export interface GitState {
  branch: string;
  branches: Branch[];
  commits: Commit[];
  working: WorkingChange[];
}

export interface Terminal {
  cwd: string;
  history: string[];
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

export interface TabRef {
  panel: string;
  refId: string | null;
}

export interface GroupSnapshot {
  active: number;
  tabs: TabRef[];
}

export interface ExplorerState {
  groups: Record<string, boolean>;
  query: string;
  tag: string;
  favOnly: boolean;
  revealFileId?: string | null;
}

export interface Session {
  sideView: string;
  sideOpen: boolean;
  dockOpen: boolean;
  rightOpen: boolean;
  dockTab: string;
  groups: GroupSnapshot[] | null;
  activeGroup: number;
  sideWidth: number;
  dockHeight: number;
  rightWidth: number;
  explorer?: ExplorerState;
}

export interface UiState {
  activeProjectId: string | null;
  activeChatId: string | null;
}

export interface AppState {
  version: number;
  ui: UiState;
  session: Session;
  settings: Settings;
  projects: Record<string, Project>;
  projectOrder: string[];
  folders: Record<string, Folder>;
  chats: Record<string, Chat>;
  files: Record<string, FileItem>;
  notes: Record<string, Note>;
  tasks: Record<string, Task>;
  prompts: Record<string, Prompt>;
  memory: Record<string, Memory>;
  git: Record<string, GitState>;
  terminals: Record<string, Terminal>;
  agents: Record<string, Agent>;
  activity: Activity[];
}
