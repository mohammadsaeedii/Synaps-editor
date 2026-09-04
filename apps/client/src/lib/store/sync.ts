/* =========================================================================
   synapse · workspace sync
   Debounced full-snapshot sync + fast-path file content PATCH.
   Zustand remains the UI source of truth; Nest/Prisma is durable storage.
   ========================================================================= */
import { workspaceService } from "@/lib/api/services/workspace.service";
import type { AppState, FileItem } from "./types";
import { useAppStore } from "./app-store";

type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";

let snapshotTimer: ReturnType<typeof setTimeout> | null = null;
let fileTimers = new Map<string, ReturnType<typeof setTimeout>>();
let hydrated = false;
let status: SyncStatus = "idle";
let lastError: string | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((l) => l());
}

function setStatus(next: SyncStatus, err: string | null = null): void {
  status = next;
  lastError = err;
  notify();
}

export function getSyncStatus(): SyncStatus {
  return status;
}

export function getSyncError(): string | null {
  return lastError;
}

export function subscribeSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isWorkspaceHydrated(): boolean {
  return hydrated;
}

/** Load remote workspace into Zustand (or push local seed if DB empty). */
export async function hydrateWorkspaceFromServer(): Promise<void> {
  try {
    setStatus("syncing");
    const { snapshot } = await workspaceService.getWorkspace();
    const local = useAppStore.getState();

    if (snapshot && Object.keys(snapshot.projects || {}).length > 0) {
      // Preserve local-only secrets
      const apiKey = local.settings.apiKey;
      const apiKeys = local.settings.apiKeys;
      useAppStore.getState().hydrate({
        ...snapshot,
        settings: {
          ...snapshot.settings,
          apiKey,
          apiKeys: apiKeys || { anthropic: apiKey || "", openai: "", google: "" },
          provider:
            (snapshot.settings as { provider?: typeof local.settings.provider }).provider ||
            local.settings.provider,
        },
      });
    } else {
      // First run: persist current local/seed state
      const { _rev: _, ...data } = useAppStore.getState();
      await workspaceService.saveWorkspace(data);
    }

    hydrated = true;
    setStatus("synced");
  } catch (err) {
    hydrated = true; // allow UI offline with local cache
    setStatus("offline", err instanceof Error ? err.message : "sync failed");
  }
}

/** Debounced full workspace PUT (projects, files, chats, …). */
export function scheduleWorkspaceSync(delayMs = 900): void {
  if (!hydrated) return;
  if (snapshotTimer) clearTimeout(snapshotTimer);
  snapshotTimer = setTimeout(() => {
    void flushWorkspaceSync();
  }, delayMs);
}

export async function flushWorkspaceSync(): Promise<void> {
  if (snapshotTimer) {
    clearTimeout(snapshotTimer);
    snapshotTimer = null;
  }
  if (!hydrated) return;

  try {
    setStatus("syncing");
    const { _rev: _, ...data } = useAppStore.getState();
    await workspaceService.saveWorkspace(data as AppState);
    setStatus("synced");
  } catch (err) {
    setStatus("error", err instanceof Error ? err.message : "save failed");
  }
}

/**
 * Fast path for editor content — PATCH a single file without rewriting the DB.
 * Falls back to full snapshot sync if the file is not yet on the server.
 */
export function scheduleFileContentSync(id: string, delayMs = 450): void {
  if (!hydrated) return;
  const prev = fileTimers.get(id);
  if (prev) clearTimeout(prev);
  fileTimers.set(
    id,
    setTimeout(() => {
      fileTimers.delete(id);
      void flushFileContentSync(id);
    }, delayMs),
  );
}

async function flushFileContentSync(id: string): Promise<void> {
  const file = useAppStore.getState().files[id] as FileItem | undefined;
  if (!file) return;

  try {
    setStatus("syncing");
    await workspaceService.updateFile(id, {
      content: file.content,
      name: file.name,
      language: file.language,
      encoding: file.encoding,
      parentId: file.parentId,
      dir: file.dir,
      mimeType: file.mimeType,
      size: file.size,
      expanded: file.expanded,
      pinned: file.pinned,
      favorite: file.favorite,
      tags: file.tags,
    });
    setStatus("synced");
  } catch {
    // File may not exist remotely yet — full sync will create it
    scheduleWorkspaceSync(200);
  }
}
