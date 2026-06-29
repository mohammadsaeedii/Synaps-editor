/* =========================================================================
   synapse · store (compat re-export)
   Existing imports from @/lib/store/store resolve here.
   ========================================================================= */
export { useAppStore, useStore, useStoreVersion } from "./hooks";
export { store } from "./facade";
export type { ItemRef, RecentRef, SearchResult } from "./selectors";
export type { AppStore, AppStoreActions } from "./app-store";
