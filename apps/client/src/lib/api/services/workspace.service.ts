import { http } from "../http-client";
import type { AppState, FileItem } from "@/lib/store/types";

export type WorkspaceSnapshot = AppState;

export interface WorkspaceResponse {
  snapshot: WorkspaceSnapshot | null;
}

export interface SaveWorkspaceResponse {
  snapshot: WorkspaceSnapshot;
}

export interface UpdateFileResponse {
  file: FileItem;
}

/** Strip secrets before sending to the API. */
export function toServerSnapshot(state: AppState): WorkspaceSnapshot {
  const { apiKey: _a, apiKeys: _k, ...settingsRest } = state.settings;
  return {
    ...state,
    settings: {
      ...settingsRest,
      apiKey: "",
      apiKeys: { anthropic: "", openai: "", google: "" },
    },
  };
}

export const workspaceService = {
  getWorkspace(signal?: AbortSignal): Promise<WorkspaceResponse> {
    return http<WorkspaceResponse>("/workspace", { signal });
  },

  saveWorkspace(state: AppState, signal?: AbortSignal): Promise<SaveWorkspaceResponse> {
    return http<SaveWorkspaceResponse>("/workspace", {
      method: "PUT",
      body: { snapshot: toServerSnapshot(state) },
      signal,
    });
  },

  updateFile(
    id: string,
    patch: Partial<FileItem>,
    signal?: AbortSignal,
  ): Promise<UpdateFileResponse> {
    return http<UpdateFileResponse>(`/files/${id}`, {
      method: "PATCH",
      body: {
        name: patch.name,
        parentId: patch.parentId,
        dir: patch.dir,
        content: patch.content,
        language: patch.language,
        encoding: patch.encoding,
        mimeType: patch.mimeType,
        size: patch.size,
        expanded: patch.expanded,
        pinned: patch.pinned,
        favorite: patch.favorite,
        tags: patch.tags,
      },
      signal,
    });
  },
};
