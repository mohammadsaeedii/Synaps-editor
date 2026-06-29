/* =========================================================================
   synapse · store
   Public entry — Zustand app store, hooks, and imperative facade.
   ========================================================================= */
export { useAppStore, useStore, useStoreVersion } from "./hooks";
export { store } from "./facade";
export { useAppStore as default } from "./hooks";
export type { AppStore, AppStoreActions } from "./app-store";
export type { ItemRef, RecentRef, SearchResult } from "./selectors";
export { KINDS, PROJECT_COLORS, ACCENTS } from "./kinds";
