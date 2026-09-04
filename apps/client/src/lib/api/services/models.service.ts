import { http } from "../http-client";
import type { AiModelsResponse } from "../types";

export const modelsService = {
  listModels(signal?: AbortSignal): Promise<AiModelsResponse> {
    return http<AiModelsResponse>("/ai/models", { signal });
  },
};
