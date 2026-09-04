"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import { modelsService } from "../services/models.service";
import { AI_MODELS, AI_PROVIDERS } from "@/lib/ai/catalog";

export function useAiModelsQuery() {
  return useQuery({
    queryKey: queryKeys.ai.models,
    queryFn: ({ signal }) => modelsService.listModels(signal),
    staleTime: 60_000,
    retry: 1,
    placeholderData: {
      providers: AI_PROVIDERS.map((p) => ({
        id: p.id,
        label: p.label,
        envConfigured: false,
      })),
      models: AI_MODELS,
    },
  });
}
