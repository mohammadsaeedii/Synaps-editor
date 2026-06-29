/* =========================================================================
   synapse · app store (Zustand)
   Persisted workspace state + actions. Slices: items, projects, folders,
   layout (session), preferences (settings), meta.
   ========================================================================= */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { uid } from "../utils";
import { KINDS, PROJECT_COLORS } from "./kinds";
import { disk, loadInitialState, pickPersistedState, STORAGE_KEY } from "./persistence";
import * as sel from "./selectors";
import { itemCollection, logActivity, newItemDefaults, touch } from "./slices/helpers";
import { blank, defaultSettings, seed } from "./seed";
import type {
  AnyItem,
  AppState,
  Chat,
  ChatMessage,
  FileItem,
  Folder,
  Kind,
  KindItemMap,
  Project,
  Session,
  Settings,
} from "./types";

/* ---------- action interface ------------------------------------------- */

export interface AppStoreActions {
  get<K extends Kind>(kind: K, id: string | null | undefined): KindItemMap[K] | null;
  list<K extends Kind>(kind: K): KindItemMap[K][];
  byProject<K extends Kind>(kind: K, pid: string | null | undefined): KindItemMap[K][];
  create<K extends Kind>(kind: K, props?: Partial<KindItemMap[K]> & { projectId?: string }, opts?: { silent?: boolean }): KindItemMap[K];
  update<K extends Kind>(kind: K, id: string, patch: Partial<KindItemMap[K]>, opts?: { silent?: boolean }): KindItemMap[K] | null;
  remove<K extends Kind>(kind: K, id: string): void;
  togglePin<K extends Kind>(kind: K, id: string): KindItemMap[K] | null;
  toggleFav<K extends Kind>(kind: K, id: string): KindItemMap[K] | null;
  setTags<K extends Kind>(kind: K, id: string, tags: string[]): KindItemMap[K] | null;
  move<K extends Kind>(kind: K, id: string, dest: Partial<KindItemMap[K]>): void;
  duplicate<K extends Kind>(kind: K, id: string): KindItemMap[K] | null;
  titleOf(kind: string, o: AnyItem | Project | null | undefined): string;
  setActiveProject(id: string): void;
  setActiveChatId(id: string | null): void;
  ensureProject(id: string): void;
  createProject(props?: { name?: string; color?: string; description?: string }): Project;
  updateProject(id: string, patch: Partial<Project>): Project | null;
  deleteProject(id: string): boolean;
  reorderProjects(order: string[]): void;
  createFolder(props?: { name?: string; projectId?: string; parentId?: string | null }): Folder;
  updateFolder(id: string, patch: Partial<Folder>): Folder | null;
  deleteFolder(id: string): void;
  pushMessage(chatId: string, m: { role: "user" | "assistant"; text: string; meta?: boolean }): ChatMessage | null;
  setSetting(patch: Partial<Settings>): void;
  setSession(patch: Partial<Session>): void;
  exportAll(): string;
  reset(): void;
  logActivity(action: string, kind: string, obj: AnyItem | Project | null): void;
  flush(): void;
  saveNow(): void;
}

export type AppStore = AppState & { _rev: number } & AppStoreActions;

/* ---------- store ------------------------------------------------------ */

export const useAppStore = create<AppStore>()(
  persist(
    immer((set, get) => {
      /** Every mutation bumps `_rev` so `useStoreVersion()` subscribers re-render. */
      const mutate = (fn: (draft: AppStore) => void) => {
        set((draft) => {
          fn(draft);
          draft._rev += 1;
        });
      };

      return {
      ...loadInitialState(),
      _rev: 0,

      flush: () => set((d) => { d._rev += 1; }),

      saveNow: () => {
        const { _rev: _, ...data } = get();
        disk.set(STORAGE_KEY, pickPersistedState(data));
      },

      get: (kind, id) => sel.getItem(get(), kind, id) as KindItemMap[typeof kind] | null,

      list: (kind) => sel.listItems(get(), kind) as KindItemMap[typeof kind][],

      byProject: (kind, pid) => sel.byProject(get(), kind, pid) as KindItemMap[typeof kind][],

      titleOf: sel.titleOf,

      create: (kind, props = {}, opts = {}) => {
        let created!: KindItemMap[typeof kind];
        mutate((draft) => {
          const o = Object.assign(newItemDefaults(draft, kind, props), props) as KindItemMap[typeof kind];
          itemCollection(draft, kind)[o.id] = o;
          if (!opts.silent) logActivity(draft, "created", kind, o);
          created = o;
        });
        return created;
      },

      update: (kind, id, patch, opts = {}) => {
        let updated: KindItemMap[typeof kind] | null = null;
        mutate((draft) => {
          const o = itemCollection(draft, kind)[id];
          if (!o) return;
          Object.assign(o, patch);
          touch(draft, o as AnyItem, kind, opts.silent ? null : "edited");
          updated = o;
        });
        return updated;
      },

      remove: (kind, id) => {
        mutate((draft) => {
          const o = itemCollection(draft, kind)[id];
          if (!o) return;
          if (kind === "file" && (o as FileItem).dir) {
            Object.values(draft.files)
              .filter((f) => f.parentId === id)
              .forEach((f) => {
                delete draft.files[f.id];
              });
          }
          delete itemCollection(draft, kind)[id];
          draft.activity = draft.activity.filter((a) => a.refId !== id);
          logActivity(draft, "deleted", kind, o as AnyItem);
        });
      },

      togglePin: (kind, id) => {
        let result: KindItemMap[typeof kind] | null = null;
        mutate((draft) => {
          const o = itemCollection(draft, kind)[id];
          if (!o) return;
          o.pinned = !o.pinned;
          touch(draft, o as AnyItem, kind, o.pinned ? "pinned" : "unpinned");
          result = o;
        });
        return result;
      },

      toggleFav: (kind, id) => {
        let result: KindItemMap[typeof kind] | null = null;
        mutate((draft) => {
          const o = itemCollection(draft, kind)[id];
          if (!o) return;
          o.favorite = !o.favorite;
          touch(draft, o as AnyItem, kind, null);
          result = o;
        });
        return result;
      },

      setTags: (kind, id, tags) =>
        get().update(kind, id, {
          tags: [...new Set(tags.map((t) => t.replace(/^#/, "").trim().toLowerCase()).filter(Boolean))],
        } as Partial<KindItemMap[typeof kind]>),

      move: (kind, id, dest) => {
        mutate((draft) => {
          const o = itemCollection(draft, kind)[id];
          if (!o) return;
          Object.assign(o, dest);
          touch(draft, o as AnyItem, kind, "moved");
        });
      },

      duplicate: (kind, id) => {
        let copy!: KindItemMap[typeof kind] | null;
        mutate((draft) => {
          const o = itemCollection(draft, kind)[id];
          if (!o) return;
          const dup = Object.assign(newItemDefaults(draft, kind, { projectId: o.projectId }), JSON.parse(JSON.stringify(o)), {
            id: uid(),
            pinned: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }) as KindItemMap[typeof kind];
          const titleKey = KINDS[kind].title;
          (dup as unknown as Record<string, unknown>)[titleKey] = sel.titleOf(kind, o as AnyItem) + " copy";
          if (kind === "chat") (dup as Chat).messages = ((o as Chat).messages || []).map((m) => ({ ...m, id: uid() }));
          itemCollection(draft, kind)[dup.id] = dup;
          logActivity(draft, "duplicated", kind, dup as AnyItem);
          copy = dup;
        });
        return copy;
      },

      setActiveProject: (id) => {
        if (!get().projects[id]) return;
        mutate((draft) => { draft.ui.activeProjectId = id; });
      },

      setActiveChatId: (id) => mutate((draft) => { draft.ui.activeChatId = id; }),

      ensureProject: (id) => {
        mutate((draft) => {
          if (!draft.git[id]) draft.git[id] = { branch: "main", branches: [{ name: "main", head: null }], commits: [], working: [] };
          if (!draft.terminals[id]) draft.terminals[id] = { cwd: "/", history: [] };
        });
      },

      createProject: (props = {}) => {
        let created!: Project;
        mutate((draft) => {
          const id = uid();
          const colorKeys = Object.keys(PROJECT_COLORS);
          const p: Project = {
            id,
            name: props.name || "New project",
            color: props.color || colorKeys[draft.projectOrder.length % colorKeys.length],
            icon: "project",
            description: props.description || "",
            pinned: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          draft.projects[id] = p;
          draft.projectOrder.push(id);
          if (!draft.git[id]) draft.git[id] = { branch: "main", branches: [{ name: "main", head: null }], commits: [], working: [] };
          if (!draft.terminals[id]) draft.terminals[id] = { cwd: "/", history: [] };
          created = p;
        });
        return created;
      },

      updateProject: (id, patch) => {
        let updated: Project | null = null;
        mutate((draft) => {
          const p = draft.projects[id];
          if (!p) return;
          Object.assign(p, patch);
          p.updatedAt = Date.now();
          updated = p;
        });
        return updated;
      },

      deleteProject: (id) => {
        const ok = sel.projects(get()).length > 1;
        if (!ok) return false;
        mutate((draft) => {
          for (const k of Object.keys(KINDS) as Kind[]) {
            sel.byProject(draft, k, id).forEach((o) => delete itemCollection(draft, k)[(o as AnyItem).id]);
          }
          draft.folders = Object.fromEntries(Object.entries(draft.folders).filter(([, f]) => f.projectId !== id));
          delete draft.projects[id];
          delete draft.git[id];
          delete draft.terminals[id];
          draft.agents = Object.fromEntries(Object.entries(draft.agents).filter(([, a]) => a.projectId !== id));
          draft.projectOrder = draft.projectOrder.filter((x) => x !== id);
          draft.activity = draft.activity.filter((a) => a.projectId !== id);
          if (draft.ui.activeProjectId === id) draft.ui.activeProjectId = draft.projectOrder[0] ?? null;
        });
        return true;
      },

      reorderProjects: (order) => mutate((draft) => { draft.projectOrder = order; }),

      createFolder: (props = {}) => {
        let created!: Folder;
        mutate((draft) => {
          const id = uid();
          draft.folders[id] = {
            id,
            name: props.name || "New folder",
            projectId: props.projectId ?? draft.ui.activeProjectId ?? "",
            parentId: props.parentId ?? null,
            expanded: true,
            order: Date.now(),
          };
          created = draft.folders[id];
        });
        return created;
      },

      updateFolder: (id, patch) => {
        let updated: Folder | null = null;
        mutate((draft) => {
          const f = draft.folders[id];
          if (!f) return;
          Object.assign(f, patch);
          updated = f;
        });
        return updated;
      },

      deleteFolder: (id) => {
        mutate((draft) => {
          const f = draft.folders[id];
          if (!f) return;
          Object.values(draft.folders)
            .filter((c) => c.parentId === id)
            .forEach((c) => { c.parentId = f.parentId; });
          Object.values(draft.chats)
            .filter((c) => c.folderId === id)
            .forEach((c) => { c.folderId = f.parentId; });
          delete draft.folders[id];
        });
      },

      pushMessage: (chatId, m) => {
        let msg: ChatMessage | null = null;
        mutate((draft) => {
          const c = draft.chats[chatId];
          if (!c) return;
          msg = { id: uid(), role: m.role, text: m.text, ts: Date.now(), meta: m.meta || false };
          c.messages.push(msg);
          c.updatedAt = Date.now();
        });
        return msg;
      },

      setSetting: (patch) => {
        mutate((draft) => { Object.assign(draft.settings, patch); });
        get().saveNow();
      },

      setSession: (patch) => mutate((draft) => { Object.assign(draft.session, patch); }),

      exportAll: () => {
        const { _rev: _, ...data } = get();
        return JSON.stringify(pickPersistedState(data), null, 2);
      },

      reset: () => {
        disk.remove(STORAGE_KEY);
        set((draft) => {
          Object.assign(draft, seed());
          draft._rev += 1;
        });
        get().saveNow();
      },

      logActivity: (action, kind, obj) => {
        if (!obj) return;
        mutate((draft) => logActivity(draft, action, kind, obj));
      },
    };
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => pickPersistedState(state),
      merge: (persisted, current) => {
        const saved = persisted as AppState | undefined;
        if (saved?.version === 2 && saved.projects) {
          return { ...current, ...mergeHydrated(saved), _rev: current._rev };
        }
        return current;
      },
    },
  ),
);

function mergeHydrated(saved: AppState): AppState {
  saved.settings = Object.assign(defaultSettings(), saved.settings);
  saved.session = Object.assign(blank().session, saved.session);
  saved.activity = saved.activity || [];
  Object.keys(saved.projects).forEach((id) => {
    if (!saved.git[id]) saved.git[id] = { branch: "main", branches: [{ name: "main", head: null }], commits: [], working: [] };
    if (!saved.terminals[id]) saved.terminals[id] = { cwd: "/", history: [] };
  });
  if (!saved.projects[saved.ui.activeProjectId ?? ""]) saved.ui.activeProjectId = saved.projectOrder[0] ?? null;
  return saved;
}

/* Re-export selectors for external use */
export type { ItemRef, RecentRef, SearchResult } from "./selectors";
