/* =========================================================================
   synapse · store facade
   Imperative API for non-React code paths (AI stream, terminal, file service).
   Mutations schedule a debounced backend sync (Prisma via Nest).
   ========================================================================= */
import { resolveProviderForModel } from "@/lib/ai/catalog";
import { useAppStore, type AppStoreActions } from "./app-store";
import { pickPersistedState } from "./persistence";
import * as sel from "./selectors";
import { KINDS, PROJECT_COLORS } from "./kinds";
import { scheduleFileContentSync, scheduleWorkspaceSync } from "./sync";
import type { AppState, Folder, Kind, KindItemMap, Project, Session, Settings } from "./types";

const s = () => useAppStore.getState();

function afterMutation(kind?: Kind, id?: string, patch?: Record<string, unknown>): void {
  // Fast path: editor content / expand toggles
  if (kind === "file" && id && patch && ("content" in patch || Object.keys(patch).length <= 3)) {
    if ("content" in patch) {
      scheduleFileContentSync(id);
      return;
    }
  }
  scheduleWorkspaceSync();
}

export const store = {
  KINDS,
  PROJECT_COLORS,
  getState: (): AppState => pickPersistedState(s()),
  save: () => { /* handled by zustand persist */ },
  saveNow: () => s().saveNow(),
  flush: () => s().flush(),
  hydrate: (snapshot: AppState) => s().hydrate(snapshot),
  get: <K extends Kind>(kind: K, id: string | null | undefined) => s().get(kind, id),
  list: <K extends Kind>(kind: K) => s().list(kind),
  byProject: <K extends Kind>(kind: K, pid: string | null | undefined) => s().byProject(kind, pid),
  create: <K extends Kind>(kind: K, props?: Partial<KindItemMap[K]> & { projectId?: string }, opts?: { silent?: boolean }) => {
    const item = s().create(kind, props, opts);
    afterMutation(kind, item.id);
    return item;
  },
  update: <K extends Kind>(kind: K, id: string, patch: Partial<KindItemMap[K]>, opts?: { silent?: boolean }) => {
    const item = s().update(kind, id, patch, opts);
    afterMutation(kind, id, patch as Record<string, unknown>);
    return item;
  },
  remove: <K extends Kind>(kind: K, id: string) => {
    s().remove(kind, id);
    afterMutation(kind, id);
  },
  togglePin: <K extends Kind>(kind: K, id: string) => {
    const item = s().togglePin(kind, id);
    afterMutation(kind, id);
    return item;
  },
  toggleFav: <K extends Kind>(kind: K, id: string) => {
    const item = s().toggleFav(kind, id);
    afterMutation(kind, id);
    return item;
  },
  setTags: <K extends Kind>(kind: K, id: string, tags: string[]) => {
    const item = s().setTags(kind, id, tags);
    afterMutation(kind, id);
    return item;
  },
  move: <K extends Kind>(kind: K, id: string, dest: Partial<KindItemMap[K]>) => {
    s().move(kind, id, dest);
    afterMutation(kind, id);
  },
  duplicate: <K extends Kind>(kind: K, id: string) => {
    const item = s().duplicate(kind, id);
    afterMutation(kind, item?.id);
    return item;
  },
  titleOf: s().titleOf,
  projects: (): Project[] => sel.projects(s()),
  project: (id: string | null | undefined): Project | null => sel.project(s(), id),
  activeProject: (): Project | null => sel.activeProject(s()),
  setActiveProject: (id: string) => {
    s().setActiveProject(id);
    // ui-only; folded into next domain sync — avoid boot PUT storms
  },
  setActiveChatId: (id: string | null) => {
    s().setActiveChatId(id);
  },
  ensureProject: (id: string) => s().ensureProject(id),
  createProject: (props?: { name?: string; color?: string; description?: string }) => {
    const p = s().createProject(props);
    scheduleWorkspaceSync();
    return p;
  },
  updateProject: (id: string, patch: Partial<Project>) => {
    const p = s().updateProject(id, patch);
    scheduleWorkspaceSync();
    return p;
  },
  deleteProject: (id: string) => {
    const ok = s().deleteProject(id);
    if (ok) scheduleWorkspaceSync();
    return ok;
  },
  reorderProjects: (order: string[]) => {
    s().reorderProjects(order);
    scheduleWorkspaceSync();
  },
  folders: (pid?: string | null): Folder[] => Object.values(s().folders).filter((f) => !pid || f.projectId === pid),
  createFolder: (props?: { name?: string; projectId?: string; parentId?: string | null }) => {
    const f = s().createFolder(props);
    scheduleWorkspaceSync();
    return f;
  },
  updateFolder: (id: string, patch: Partial<Folder>) => {
    const f = s().updateFolder(id, patch);
    scheduleWorkspaceSync();
    return f;
  },
  deleteFolder: (id: string) => {
    s().deleteFolder(id);
    scheduleWorkspaceSync();
  },
  pushMessage: (chatId: string, m: { role: "user" | "assistant"; text: string; meta?: boolean }) => {
    const msg = s().pushMessage(chatId, m);
    scheduleWorkspaceSync();
    return msg;
  },
  allItems: (pid?: string | null) => sel.allItems(s(), pid),
  favorites: (pid?: string | null) => sel.favorites(s(), pid),
  pinned: (pid?: string | null) => sel.pinned(s(), pid),
  recent: (pid?: string | null, limit?: number) => sel.recent(s(), pid, limit),
  allTags: (pid?: string | null) => sel.allTags(s(), pid),
  search: (query: string, opts?: { pid?: string | null; kinds?: string[]; tag?: string }) => sel.search(s(), query, opts),
  settings: (): Settings => s().settings,
  setSetting: (patch: Partial<Settings>) => {
    const next = { ...patch };
    if (next.apiKeys) {
      next.apiKeys = { ...s().settings.apiKeys, ...next.apiKeys };
      if (next.apiKeys.anthropic !== undefined) next.apiKey = next.apiKeys.anthropic;
    } else if (typeof next.apiKey === "string") {
      next.apiKeys = { ...s().settings.apiKeys, anthropic: next.apiKey };
    }
    if (next.model && !next.provider) {
      next.provider = resolveProviderForModel(next.model);
    }
    s().setSetting(next);
    const secretOnly =
      Object.keys(patch).every((k) => k === "apiKey" || k === "apiKeys");
    if (!secretOnly) scheduleWorkspaceSync();
  },
  session: (): Session => s().session,
  setSession: (patch: Partial<Session>) => {
    // Layout chrome stays localStorage-first; next domain save persists session.
    s().setSession(patch);
  },
  exportAll: () => s().exportAll(),
  reset: () => {
    s().reset();
    scheduleWorkspaceSync(200);
  },
  logActivity: (action: string, kind: string, obj: Parameters<AppStoreActions["logActivity"]>[2]) => s().logActivity(action, kind, obj),
};
