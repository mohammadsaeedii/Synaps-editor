/* =========================================================================
   synapse · store — persistence
   localStorage hydration + merge for the v2 workspace tree.
   ========================================================================= */
import type { AppState } from "./types";
import { blank, defaultSettings, seed } from "./seed";

export const STORAGE_KEY = "synapse:v2";

const hasWindow = () => typeof window !== "undefined";

const mem: Record<string, unknown> = {};

export const disk = {
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
  remove(k: string): void {
    if (!hasWindow()) {
      delete mem[k];
      return;
    }
    try {
      localStorage.removeItem(k);
    } catch {
      delete mem[k];
    }
  },
};

export function mergeHydratedState(saved: AppState): AppState {
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

export function loadInitialState(): AppState {
  const saved = disk.get<AppState>(STORAGE_KEY);
  if (saved && saved.version === 2 && saved.projects) return mergeHydratedState(saved);
  return seed();
}

/** Fields written to localStorage by the persist middleware. */
export function pickPersistedState(state: AppState): AppState {
  return {
    version: state.version,
    ui: state.ui,
    session: state.session,
    settings: state.settings,
    projects: state.projects,
    projectOrder: state.projectOrder,
    folders: state.folders,
    chats: state.chats,
    files: state.files,
    notes: state.notes,
    tasks: state.tasks,
    prompts: state.prompts,
    memory: state.memory,
    git: state.git,
    terminals: state.terminals,
    agents: state.agents,
    activity: state.activity,
  };
}
