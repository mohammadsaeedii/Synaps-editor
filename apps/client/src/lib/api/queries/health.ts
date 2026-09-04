import { queryOptions } from "@tanstack/react-query";
import { healthService } from "../services/health.service";
import { queryKeys } from "../query-keys";

export const healthQueryOptions = queryOptions({
  queryKey: queryKeys.health.root,
  queryFn: ({ signal }) => healthService.getHealth(signal),
  staleTime: 15_000,
  retry: 1,
});
