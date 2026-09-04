"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppState, FileItem } from "@/lib/store/types";
import { workspaceQueryOptions } from "../queries/workspace";
import { queryKeys } from "../query-keys";
import { workspaceService } from "../services/workspace.service";

export function useWorkspaceQuery(enabled = true) {
  return useQuery({ ...workspaceQueryOptions, enabled });
}

export function useSaveWorkspaceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.workspace.save,
    mutationFn: (state: AppState) => workspaceService.saveWorkspace(state),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.workspace.root, { snapshot: data.snapshot });
    },
  });
}

export function useUpdateFileMutation() {
  return useMutation({
    mutationKey: queryKeys.workspace.file,
    mutationFn: ({ id, patch }: { id: string; patch: Partial<FileItem> }) =>
      workspaceService.updateFile(id, patch),
  });
}
