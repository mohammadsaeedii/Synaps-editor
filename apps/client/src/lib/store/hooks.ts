/* =========================================================================
   synapse · store hooks
   React bindings for the Zustand app store.
   ========================================================================= */
import { useAppStore } from "./app-store";
import type { AppState } from "./types";

/** Subscribe to any store mutation (replaces legacy useStoreVersion). */
export function useStoreVersion(): number {
  return useAppStore((s) => s._rev);
}

/** Select a slice of persisted AppState. */
export function useStore<T>(selector: (s: AppState) => T): T {
  return useAppStore((s) => selector(s));
}

export { useAppStore };
