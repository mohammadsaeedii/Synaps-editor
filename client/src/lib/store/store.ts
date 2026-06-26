/* =========================================================================
   synapse · store
   The single source of truth, ported from the original store.js. A v2 state
   tree persisted to localStorage, a generic collection layer keyed by KIND, an
   activity log, global fuzzy search and project/folder management.

   In the original, panels subscribed to an event bus. Here the same coarse
   invalidation is exposed to React through useSyncExternalStore: every mutator
   bumps a version counter and notifies subscribers, and components read the
   live state tree in render. Mutations are in-place (as before) — the version
   bump is what drives re-renders.
   ========================================================================= */
"use client";
import { useSyncExternalStore } from "react";
import { fuzzy } from "../fuzzy";
import { uid } from "../utils";
import { KINDS, PROJECT_COLORS } from "./kinds";
import { blank, defaultSettings, seed } from "./seed";
import type {
  Activity,
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

const KEY = "synapse:v2";
const hasWindow = () => typeof window !== "undefined";

/* ---------- persistence (localStorage + in-memory fallback) ------------ */
const mem: Record<string, unknown> = {};
const disk = {
  get<T>(k: string): T | null {
    if (!hasWindow()) return null;
    try {
      const r = localStorage.getItem(k);
      return r ? (JSON.parse(r) as T) : null;
    } catch {
      return (mem[k] as T) ?? null;
    }
  },
  set(k: string, v: unknown): void {
    if (!hasWindow()) {
      mem[k] = v;
      return;
    }
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      mem[k] = v;
    }
  },
};

/* ---------- reactive core ---------------------------------------------- */
let state: AppState = load();
let version = 0;
const listeners = new Set<() => void>();
let saveT: ReturnType<typeof setTimeout> | null = null;

function notify(): void {
  version++;
  listeners.forEach((l) => l());
}
function save(): void {
  if (saveT) return;
  saveT = setTimeout(() => {
    saveT = null;
    disk.set(KEY, state);
  }, 80);
}
function saveNow(): void {
  if (saveT) {
    clearTimeout(saveT);
    saveT = null;
  }
  disk.set(KEY, state);
}
/** Persist (debounced) + notify React subscribers. The bus replacement. */
function emit(): void {
  save();
  notify();
}

/* ---------- collection helpers ----------------------------------------- */
function coll<K extends Kind>(kind: K): Record<string, KindItemMap[K]> {
  return state[KINDS[kind].coll] as Record<string, KindItemMap[K]>;
}
function titleOf(kind: string, o: AnyItem | Project | null | undefined): string {
  if (!o) return "Untitled";
  const key = KINDS[kind]?.title ?? "title";
  return ((o as unknown as Record<string, unknown>)[key] as string) || "Untitled";
}

function newItemDefaults<K extends Kind>(kind: K, props: { projectId?: string }): KindItemMap[K] {
  const now = Date.now();
  const baseObj = {
    id: uid(),
    projectId: props.projectId ?? state.ui.activeProjectId ?? "",
    pinned: false,
    favorite: false,
    tags: [] as string[],
    createdAt: now,
    updatedAt: now,
  };
  let obj: object = baseObj;
  switch (kind) {
    case "chat":
      obj = { ...baseObj, title: "New chat", folderId: null, archived: false, system: "", persona: "", model: "", messages: [] };
      break;
    case "file":
      obj = { ...baseObj, name: "untitled.txt", parentId: null, dir: false, content: "", language: "text" };
      break;
    case "note":
      obj = { ...baseObj, title: "Untitled note", content: "" };
      break;
    case "task":
      obj = { ...baseObj, title: "New task", status: "todo", priority: "med", due: null, notes: "", order: now };
      break;
    case "prompt":
      obj = { ...baseObj, title: "New prompt", body: "", uses: 0 };
      break;
    case "memory":
      obj = { ...baseObj, title: "New memory", body: "", scope: "project" };
      break;
  }
  return obj as unknown as KindItemMap[K];
}

/* ---------- activity log ----------------------------------------------- */
function logActivity(action: string, kind: string, obj: AnyItem | Project | null): void {
  if (!obj) return;
  state.activity.unshift({
    id: uid(),
    action,
    kind,
    refId: obj.id,
    projectId: (obj as AnyItem).projectId ?? null,
    title: titleOf(kind, obj),
    ts: Date.now(),
  } as Activity);
  if (state.activity.length > 120) state.activity.length = 120;
}
function touch(obj: AnyItem, kind: string, action: string | null): void {
  obj.updatedAt = Date.now();
  if (action) logActivity(action, kind, obj);
}

/* ---------- generic collection API ------------------------------------- */
function get<K extends Kind>(kind: K, id: string | null | undefined): KindItemMap[K] | null {
  if (!id) return null;
  return coll(kind)[id] || null;
}
function list<K extends Kind>(kind: K): KindItemMap[K][] {
  return Object.values(coll(kind));
}
function byProject<K extends Kind>(kind: K, pid: string | null | undefined): KindItemMap[K][] {
  const all = list(kind);
  if (!pid || pid === "all") return all;
  return all.filter((o) => o.projectId === pid);
}
function create<K extends Kind>(kind: K, props: Partial<KindItemMap[K]> & { projectId?: string } = {}, opts: { silent?: boolean } = {}): KindItemMap[K] {
  const o = Object.assign(newItemDefaults(kind, props), props) as unknown as KindItemMap[K];
  coll(kind)[o.id] = o;
  if (!opts.silent) logActivity("created", kind, o);
  emit();
  return o;
}
function update<K extends Kind>(kind: K, id: string, patch: Partial<KindItemMap[K]>, opts: { silent?: boolean } = {}): KindItemMap[K] | null {
  const o = get(kind, id);
  if (!o) return null;
  Object.assign(o, patch);
  touch(o, kind, opts.silent ? null : "edited");
  emit();
  return o;
}
function remove<K extends Kind>(kind: K, id: string): void {
  const o = get(kind, id);
  if (!o) return;
  if (kind === "file" && (o as FileItem).dir) {
    list("file")
      .filter((f) => f.parentId === id)
      .forEach((f) => remove("file", f.id));
  }
  delete coll(kind)[id];
  state.activity = state.activity.filter((a) => a.refId !== id);
  logActivity("deleted", kind, o);
  emit();
}
function togglePin<K extends Kind>(kind: K, id: string): KindItemMap[K] | null {
  const o = get(kind, id);
  if (o) {
    o.pinned = !o.pinned;
    touch(o, kind, o.pinned ? "pinned" : "unpinned");
    emit();
  }
  return o;
}
function toggleFav<K extends Kind>(kind: K, id: string): KindItemMap[K] | null {
  const o = get(kind, id);
  if (o) {
    o.favorite = !o.favorite;
    touch(o, kind, null);
    emit();
  }
  return o;
}
function setTags<K extends Kind>(kind: K, id: string, tags: string[]): KindItemMap[K] | null {
  return update(kind, id, {
    tags: [...new Set(tags.map((t) => t.replace(/^#/, "").trim().toLowerCase()).filter(Boolean))],
  } as Partial<KindItemMap[K]>);
}
function move<K extends Kind>(kind: K, id: string, dest: Partial<KindItemMap[K]>): void {
  const o = get(kind, id);
  if (!o) return;
  Object.assign(o, dest);
  touch(o, kind, "moved");
  emit();
}
function duplicate<K extends Kind>(kind: K, id: string): KindItemMap[K] | null {
  const o = get(kind, id);
  if (!o) return null;
  const copy = Object.assign(newItemDefaults(kind, { projectId: o.projectId }), JSON.parse(JSON.stringify(o)), {
    id: uid(),
    pinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }) as unknown as KindItemMap[K];
  const titleKey = KINDS[kind].title;
  (copy as unknown as Record<string, unknown>)[titleKey] = titleOf(kind, o) + " copy";
  if (kind === "chat") (copy as Chat).messages = ((o as Chat).messages || []).map((m) => ({ ...m, id: uid() }));
  coll(kind)[copy.id] = copy;
  logActivity("duplicated", kind, copy);
  emit();
  return copy;
}

/* ---------- projects --------------------------------------------------- */
function projects(): Project[] {
  return state.projectOrder.map((id) => state.projects[id]).filter(Boolean);
}
function project(id: string | null | undefined): Project | null {
  return (id && state.projects[id]) || null;
}
function activeProject(): Project | null {
  return project(state.ui.activeProjectId) || projects()[0] || null;
}
function setActiveProject(id: string): void {
  if (state.projects[id]) {
    state.ui.activeProjectId = id;
    emit();
  }
}
function ensureProject(id: string): void {
  if (!state.git[id]) state.git[id] = { branch: "main", branches: [{ name: "main", head: null }], commits: [], working: [] };
  if (!state.terminals[id]) state.terminals[id] = { cwd: "/", history: [] };
}
function createProject(props: { name?: string; color?: string; description?: string } = {}): Project {
  const id = uid();
  const colorKeys = Object.keys(PROJECT_COLORS);
  state.projects[id] = {
    id,
    name: props.name || "New project",
    color: props.color || colorKeys[projects().length % colorKeys.length],
    icon: "project",
    description: props.description || "",
    pinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  state.projectOrder.push(id);
  ensureProject(id);
  emit();
  return state.projects[id];
}
function updateProject(id: string, patch: Partial<Project>): Project | null {
  const p = project(id);
  if (p) {
    Object.assign(p, patch);
    p.updatedAt = Date.now();
    emit();
  }
  return p;
}
function deleteProject(id: string): boolean {
  if (projects().length <= 1) return false;
  for (const k of Object.keys(KINDS) as Kind[]) byProject(k, id).forEach((o) => delete coll(k)[o.id]);
  state.folders = Object.fromEntries(Object.entries(state.folders).filter(([, f]) => f.projectId !== id));
  delete state.projects[id];
  delete state.git[id];
  delete state.terminals[id];
  state.agents = Object.fromEntries(Object.entries(state.agents).filter(([, a]) => a.projectId !== id));
  state.projectOrder = state.projectOrder.filter((x) => x !== id);
  state.activity = state.activity.filter((a) => a.projectId !== id);
  if (state.ui.activeProjectId === id) state.ui.activeProjectId = state.projectOrder[0];
  emit();
  return true;
}
function reorderProjects(order: string[]): void {
  state.projectOrder = order;
  emit();
}

/* ---------- chat folders (nested) -------------------------------------- */
function folders(pid?: string | null): Folder[] {
  return Object.values(state.folders).filter((f) => !pid || f.projectId === pid);
}
function createFolder(props: { name?: string; projectId?: string; parentId?: string | null } = {}): Folder {
  const id = uid();
  state.folders[id] = {
    id,
    name: props.name || "New folder",
    projectId: props.projectId ?? state.ui.activeProjectId ?? "",
    parentId: props.parentId ?? null,
    expanded: true,
    order: Date.now(),
  };
  emit();
  return state.folders[id];
}
function updateFolder(id: string, patch: Partial<Folder>): Folder | null {
  const f = state.folders[id];
  if (f) {
    Object.assign(f, patch);
    emit();
  }
  return f || null;
}
function deleteFolder(id: string): void {
  const f = state.folders[id];
  if (!f) return;
  folders()
    .filter((c) => c.parentId === id)
    .forEach((c) => (c.parentId = f.parentId));
  list("chat")
    .filter((c) => c.folderId === id)
    .forEach((c) => (c.folderId = f.parentId));
  delete state.folders[id];
  emit();
}

/* ---------- chat messages ---------------------------------------------- */
function pushMessage(chatId: string, m: { role: "user" | "assistant"; text: string; meta?: boolean }): ChatMessage | null {
  const c = get("chat", chatId);
  if (!c) return null;
  const msg: ChatMessage = { id: uid(), role: m.role, text: m.text, ts: Date.now(), meta: m.meta || false };
  c.messages.push(msg);
  c.updatedAt = Date.now();
  save();
  return msg;
}

/* ---------- cross-cutting selectors ------------------------------------ */
export interface ItemRef {
  kind: Kind;
  o: AnyItem;
}
function allItems(pid?: string | null): ItemRef[] {
  const out: ItemRef[] = [];
  for (const kind of Object.keys(KINDS) as Kind[]) byProject(kind, pid).forEach((o) => out.push({ kind, o }));
  return out;
}
function favorites(pid?: string | null): ItemRef[] {
  return allItems(pid)
    .filter((x) => x.o.favorite)
    .sort((a, b) => b.o.updatedAt - a.o.updatedAt);
}
function pinned(pid?: string | null): ItemRef[] {
  return allItems(pid)
    .filter((x) => x.o.pinned)
    .sort((a, b) => b.o.updatedAt - a.o.updatedAt);
}
export interface RecentRef extends ItemRef {
  ts: number;
  action: string;
}
function recent(pid?: string | null, limit = 12): RecentRef[] {
  const seen = new Set<string>();
  const out: RecentRef[] = [];
  for (const a of state.activity) {
    if (a.action === "deleted") continue;
    if (pid && pid !== "all" && a.projectId !== pid) continue;
    const key = a.kind + ":" + a.refId;
    if (seen.has(key)) continue;
    const o = get(a.kind as Kind, a.refId);
    if (!o) continue;
    seen.add(key);
    out.push({ kind: a.kind as Kind, o, ts: a.ts, action: a.action });
    if (out.length >= limit) break;
  }
  return out;
}
function allTags(pid?: string | null): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const { o } of allItems(pid)) (o.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));
}

/* ---------- global search ---------------------------------------------- */
export interface SearchResult {
  kind: string;
  id: string;
  title: string;
  snippet: string;
  score: number;
  idx: number[];
  projectId: string | null;
  o: AnyItem | Project;
}
function snippetOf(kind: string, o: AnyItem, q?: string): string {
  let s = KINDS[kind].body(o).replace(/\s+/g, " ").trim();
  if (q) {
    const i = s.toLowerCase().indexOf(q.toLowerCase());
    if (i > 30) s = "…" + s.slice(i - 20);
  }
  return s.slice(0, 120) || "—";
}
function search(query: string, { pid, kinds, tag }: { pid?: string | null; kinds?: string[]; tag?: string } = {}): SearchResult[] {
  const q = query.trim();
  const out: SearchResult[] = [];
  const wanted = kinds && kinds.length ? new Set(kinds) : null;
  for (const kind of Object.keys(KINDS) as Kind[]) {
    if (wanted && !wanted.has(kind)) continue;
    for (const o of byProject(kind, pid)) {
      if (tag && !(o.tags || []).includes(tag)) continue;
      const title = titleOf(kind, o);
      const fT = fuzzy(q, title);
      if (!q) {
        out.push({ kind, id: o.id, title, snippet: snippetOf(kind, o), score: o.updatedAt / 1e12, idx: [], projectId: o.projectId, o });
        continue;
      }
      const fB = q.length >= 2 ? fuzzy(q, KINDS[kind].body(o).slice(0, 600)) : null;
      if (fT || fB) {
        const score = (fT ? fT.score * 3 : 0) + (fB ? fB.score : 0);
        out.push({ kind, id: o.id, title, snippet: snippetOf(kind, o, q), score, idx: fT ? fT.idx : [], projectId: o.projectId, o });
      }
    }
  }
  if (!wanted || wanted.has("project")) {
    for (const p of projects()) {
      const f = q ? fuzzy(q, p.name) : { score: 0, idx: [] };
      if (f) out.push({ kind: "project", id: p.id, title: p.name, snippet: p.description || "Project", score: (f.score || 0) + 1, idx: f.idx, projectId: p.id, o: p });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 60);
}

/* ---------- settings / session ----------------------------------------- */
function settings(): Settings {
  return state.settings;
}
function setSetting(patch: Partial<Settings>): void {
  Object.assign(state.settings, patch);
  saveNow();
  notify();
}
function session(): Session {
  return state.session;
}
function setSession(patch: Partial<Session>): void {
  Object.assign(state.session, patch);
  emit();
}

/* ---------- export / reset --------------------------------------------- */
function exportAll(): string {
  return JSON.stringify(state, null, 2);
}
function reset(): void {
  if (hasWindow()) localStorage.removeItem(KEY);
  state = seed();
  saveNow();
  notify();
}

/* ---------- load ------------------------------------------------------- */
function load(): AppState {
  const s = disk.get<AppState>(KEY);
  if (s && s.version === 2 && s.projects) {
    s.settings = Object.assign(defaultSettings(), s.settings);
    s.session = Object.assign(blank().session, s.session);
    s.activity = s.activity || [];
    Object.keys(s.projects).forEach((id) => {
      if (!s.git[id]) s.git[id] = { branch: "main", branches: [{ name: "main", head: null }], commits: [], working: [] };
      if (!s.terminals[id]) s.terminals[id] = { cwd: "/", history: [] };
    });
    if (!s.projects[s.ui.activeProjectId ?? ""]) s.ui.activeProjectId = s.projectOrder[0] ?? null;
    return s;
  }
  return seed();
}

/* ---------- public store ----------------------------------------------- */
export const store = {
  KINDS,
  PROJECT_COLORS,
  getState: () => state,
  save,
  saveNow,
  // generic items
  get,
  list,
  byProject,
  create,
  update,
  remove,
  togglePin,
  toggleFav,
  setTags,
  move,
  duplicate,
  titleOf,
  // projects
  projects,
  project,
  activeProject,
  setActiveProject,
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  ensureProject,
  // folders
  folders,
  createFolder,
  updateFolder,
  deleteFolder,
  // chat
  pushMessage,
  // selectors
  allItems,
  favorites,
  pinned,
  recent,
  allTags,
  search,
  // settings / session
  settings,
  setSetting,
  session,
  setSession,
  // data
  exportAll,
  reset,
  logActivity,
  // reactive escape hatch (used by the chat stream which mutates messages
  // imperatively, then flushes)
  flush: emit,
};

/* ---------- React bindings --------------------------------------------- */
function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Subscribe to any store change; returns the monotonic version counter. */
export function useStoreVersion(): number {
  return useSyncExternalStore(subscribe, () => version, () => version);
}

/** Subscribe + select a slice of state. Coarse invalidation, like the original. */
export function useStore<T>(selector: (s: AppState) => T): T {
  useStoreVersion();
  return selector(state);
}
