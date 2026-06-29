/* =========================================================================
   synapse · store facade
   Imperative API for non-React code paths (AI stream, terminal, file service).
   ========================================================================= */
import { useAppStore, type AppStoreActions } from "./app-store";
import { pickPersistedState } from "./persistence";
import * as sel from "./selectors";
import { KINDS, PROJECT_COLORS } from "./kinds";
import type { AppState, Folder, Kind, KindItemMap, Project, Session, Settings } from "./types";

const s = () => useAppStore.getState();

export const store = {
  KINDS,
  PROJECT_COLORS,
  getState: (): AppState => pickPersistedState(s()),
  save: () => { /* handled by zustand persist */ },
  saveNow: () => s().saveNow(),
  flush: () => s().flush(),
  get: <K extends Kind>(kind: K, id: string | null | undefined) => s().get(kind, id),
  list: <K extends Kind>(kind: K) => s().list(kind),
  byProject: <K extends Kind>(kind: K, pid: string | null | undefined) => s().byProject(kind, pid),
  create: <K extends Kind>(kind: K, props?: Partial<KindItemMap[K]> & { projectId?: string }, opts?: { silent?: boolean }) => s().create(kind, props, opts),
  update: <K extends Kind>(kind: K, id: string, patch: Partial<KindItemMap[K]>, opts?: { silent?: boolean }) => s().update(kind, id, patch, opts),
  remove: <K extends Kind>(kind: K, id: string) => s().remove(kind, id),
  togglePin: <K extends Kind>(kind: K, id: string) => s().togglePin(kind, id),
  toggleFav: <K extends Kind>(kind: K, id: string) => s().toggleFav(kind, id),
  setTags: <K extends Kind>(kind: K, id: string, tags: string[]) => s().setTags(kind, id, tags),
  move: <K extends Kind>(kind: K, id: string, dest: Partial<KindItemMap[K]>) => s().move(kind, id, dest),
  duplicate: <K extends Kind>(kind: K, id: string) => s().duplicate(kind, id),
  titleOf: s().titleOf,
  projects: (): Project[] => sel.projects(s()),
  project: (id: string | null | undefined): Project | null => sel.project(s(), id),
  activeProject: (): Project | null => sel.activeProject(s()),
  setActiveProject: (id: string) => s().setActiveProject(id),
  setActiveChatId: (id: string | null) => s().setActiveChatId(id),
  ensureProject: (id: string) => s().ensureProject(id),
  createProject: (props?: { name?: string; color?: string; description?: string }) => s().createProject(props),
  updateProject: (id: string, patch: Partial<Project>) => s().updateProject(id, patch),
  deleteProject: (id: string) => s().deleteProject(id),
  reorderProjects: (order: string[]) => s().reorderProjects(order),
  folders: (pid?: string | null): Folder[] => Object.values(s().folders).filter((f) => !pid || f.projectId === pid),
  createFolder: (props?: { name?: string; projectId?: string; parentId?: string | null }) => s().createFolder(props),
  updateFolder: (id: string, patch: Partial<Folder>) => s().updateFolder(id, patch),
  deleteFolder: (id: string) => s().deleteFolder(id),
  pushMessage: (chatId: string, m: { role: "user" | "assistant"; text: string; meta?: boolean }) => s().pushMessage(chatId, m),
  allItems: (pid?: string | null) => sel.allItems(s(), pid),
  favorites: (pid?: string | null) => sel.favorites(s(), pid),
  pinned: (pid?: string | null) => sel.pinned(s(), pid),
  recent: (pid?: string | null, limit?: number) => sel.recent(s(), pid, limit),
  allTags: (pid?: string | null) => sel.allTags(s(), pid),
  search: (query: string, opts?: { pid?: string | null; kinds?: string[]; tag?: string }) => sel.search(s(), query, opts),
  settings: (): Settings => s().settings,
  setSetting: (patch: Partial<Settings>) => s().setSetting(patch),
  session: (): Session => s().session,
  setSession: (patch: Partial<Session>) => s().setSession(patch),
  exportAll: () => s().exportAll(),
  reset: () => s().reset(),
  logActivity: (action: string, kind: string, obj: Parameters<AppStoreActions["logActivity"]>[2]) => s().logActivity(action, kind, obj),
};
