/**
 * Workspace snapshot DTO — mirrors the client AppState domain shape
 * so hydrate/sync stay type-aligned across the monorepo boundary.
 */
export type ChatRole = 'user' | 'assistant';

export interface WorkspaceChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  ts: number;
  meta?: boolean;
}

export interface WorkspaceBaseItem {
  id: string;
  projectId: string;
  pinned: boolean;
  favorite: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceProject {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceFile extends WorkspaceBaseItem {
  name: string;
  parentId: string | null;
  dir: boolean;
  content: string;
  language: string;
  encoding?: 'text' | 'base64';
  mimeType?: string;
  size?: number;
  expanded?: boolean;
}

export interface WorkspaceChat extends WorkspaceBaseItem {
  title: string;
  folderId: string | null;
  archived: boolean;
  system: string;
  persona: string;
  model: string;
  messages: WorkspaceChatMessage[];
}

export interface WorkspaceNote extends WorkspaceBaseItem {
  title: string;
  content: string;
}

export interface WorkspaceTask extends WorkspaceBaseItem {
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'med' | 'high';
  due: number | null;
  notes: string;
  order: number;
}

export interface WorkspacePrompt extends WorkspaceBaseItem {
  title: string;
  body: string;
  uses: number;
}

export interface WorkspaceMemory extends WorkspaceBaseItem {
  title: string;
  body: string;
  scope: 'project' | 'global';
}

export interface WorkspaceFolder {
  id: string;
  name: string;
  projectId: string;
  parentId: string | null;
  expanded: boolean;
  order: number;
}

export interface WorkspaceAgent {
  id: string;
  name: string;
  role: string;
  model: string;
  status: string;
  projectId: string;
  system: string;
  createdAt: number;
  runs: unknown[];
}

export interface WorkspaceSettings {
  theme: string;
  accent: string;
  density: string;
  name: string;
  plan: string;
  model: string;
  provider?: string;
  systemPrompt: string;
  reduceMotion: boolean;
  /** Never persisted server-side; ignored on write. */
  apiKey?: string;
  apiKeys?: Record<string, string>;
}

export interface WorkspaceSnapshot {
  version: number;
  ui: {
    activeProjectId: string | null;
    activeChatId: string | null;
  };
  session: Record<string, unknown>;
  settings: WorkspaceSettings;
  projects: Record<string, WorkspaceProject>;
  projectOrder: string[];
  folders: Record<string, WorkspaceFolder>;
  chats: Record<string, WorkspaceChat>;
  files: Record<string, WorkspaceFile>;
  notes: Record<string, WorkspaceNote>;
  tasks: Record<string, WorkspaceTask>;
  prompts: Record<string, WorkspacePrompt>;
  memory: Record<string, WorkspaceMemory>;
  git: Record<string, unknown>;
  terminals: Record<string, unknown>;
  agents: Record<string, WorkspaceAgent>;
  activity: unknown[];
}

export interface UpdateFileDto {
  name?: string;
  parentId?: string | null;
  dir?: boolean;
  content?: string;
  language?: string;
  encoding?: string;
  mimeType?: string | null;
  size?: number | null;
  expanded?: boolean;
  pinned?: boolean;
  favorite?: boolean;
  tags?: string[];
}
