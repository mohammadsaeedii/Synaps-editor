/* =========================================================================
   synapse · store — pure selectors
   Read-only helpers that operate on AppState without mutating.
   ========================================================================= */
import { fuzzy } from "../fuzzy";
import { KINDS } from "./kinds";
import type { AnyItem, AppState, Kind, Project } from "./types";

export function titleOf(kind: string, o: AnyItem | Project | null | undefined): string {
  if (!o) return "Untitled";
  const key = KINDS[kind as Kind]?.title ?? "title";
  return ((o as unknown as Record<string, unknown>)[key] as string) || "Untitled";
}

export function getItem<K extends Kind>(state: AppState, kind: K, id: string | null | undefined) {
  if (!id) return null;
  return (state[KINDS[kind].coll] as Record<string, unknown>)[id] ?? null;
}

export function listItems<K extends Kind>(state: AppState, kind: K) {
  return Object.values(state[KINDS[kind].coll] as Record<string, unknown>);
}

export function byProject<K extends Kind>(state: AppState, kind: K, pid: string | null | undefined) {
  const all = listItems(state, kind);
  if (!pid || pid === "all") return all;
  return all.filter((o) => (o as AnyItem).projectId === pid);
}

export function projects(state: AppState): Project[] {
  return state.projectOrder.map((id) => state.projects[id]).filter(Boolean);
}

export function project(state: AppState, id: string | null | undefined): Project | null {
  return (id && state.projects[id]) || null;
}

export function activeProject(state: AppState): Project | null {
  return project(state, state.ui.activeProjectId) || projects(state)[0] || null;
}

export interface ItemRef {
  kind: Kind;
  o: AnyItem;
}

export function allItems(state: AppState, pid?: string | null): ItemRef[] {
  const out: ItemRef[] = [];
  for (const kind of Object.keys(KINDS) as Kind[]) {
    byProject(state, kind, pid).forEach((o) => out.push({ kind, o: o as AnyItem }));
  }
  return out;
}

export function favorites(state: AppState, pid?: string | null): ItemRef[] {
  return allItems(state, pid)
    .filter((x) => x.o.favorite)
    .sort((a, b) => b.o.updatedAt - a.o.updatedAt);
}

export function pinned(state: AppState, pid?: string | null): ItemRef[] {
  return allItems(state, pid)
    .filter((x) => x.o.pinned)
    .sort((a, b) => b.o.updatedAt - a.o.updatedAt);
}

export interface RecentRef extends ItemRef {
  ts: number;
  action: string;
}

export function recent(state: AppState, pid?: string | null, limit = 12): RecentRef[] {
  const seen = new Set<string>();
  const out: RecentRef[] = [];
  for (const a of state.activity) {
    if (a.action === "deleted") continue;
    if (pid && pid !== "all" && a.projectId !== pid) continue;
    const key = a.kind + ":" + a.refId;
    if (seen.has(key)) continue;
    const o = getItem(state, a.kind as Kind, a.refId);
    if (!o) continue;
    seen.add(key);
    out.push({ kind: a.kind as Kind, o: o as AnyItem, ts: a.ts, action: a.action });
    if (out.length >= limit) break;
  }
  return out;
}

export function allTags(state: AppState, pid?: string | null): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const { o } of allItems(state, pid)) (o.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));
}

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
  let s = KINDS[kind as Kind].body(o).replace(/\s+/g, " ").trim();
  if (q) {
    const i = s.toLowerCase().indexOf(q.toLowerCase());
    if (i > 30) s = "…" + s.slice(i - 20);
  }
  return s.slice(0, 120) || "—";
}

export function search(
  state: AppState,
  query: string,
  { pid, kinds, tag }: { pid?: string | null; kinds?: string[]; tag?: string } = {},
): SearchResult[] {
  const q = query.trim();
  const out: SearchResult[] = [];
  const wanted = kinds && kinds.length ? new Set(kinds) : null;
  for (const kind of Object.keys(KINDS) as Kind[]) {
    if (wanted && !wanted.has(kind)) continue;
    for (const o of byProject(state, kind, pid)) {
      const item = o as AnyItem;
      if (tag && !(item.tags || []).includes(tag)) continue;
      const t = titleOf(kind, item);
      const fT = fuzzy(q, t);
      if (!q) {
        out.push({ kind, id: item.id, title: t, snippet: snippetOf(kind, item), score: item.updatedAt / 1e12, idx: [], projectId: item.projectId, o: item });
        continue;
      }
      const fB = q.length >= 2 ? fuzzy(q, KINDS[kind].body(item).slice(0, 600)) : null;
      if (fT || fB) {
        const score = (fT ? fT.score * 3 : 0) + (fB ? fB.score : 0);
        out.push({ kind, id: item.id, title: t, snippet: snippetOf(kind, item, q), score, idx: fT ? fT.idx : [], projectId: item.projectId, o: item });
      }
    }
  }
  if (!wanted || wanted.has("project")) {
    for (const p of projects(state)) {
      const f = q ? fuzzy(q, p.name) : { score: 0, idx: [] };
      if (f) out.push({ kind: "project", id: p.id, title: p.name, snippet: p.description || "Project", score: (f.score || 0) + 1, idx: f.idx, projectId: p.id, o: p });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 60);
}
