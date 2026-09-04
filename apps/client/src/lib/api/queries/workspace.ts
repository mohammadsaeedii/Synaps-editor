import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import { workspaceService } from "../services/workspace.service";

export const workspaceQueryOptions = queryOptions({
  queryKey: queryKeys.workspace.root,
  queryFn: ({ signal }) => workspaceService.getWorkspace(signal),
  staleTime: 30_000,
  retry: 1,
});
