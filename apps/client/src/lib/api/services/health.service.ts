import { http } from "../http-client";
import type { HealthResponse } from "../types";

export const healthService = {
  getHealth(signal?: AbortSignal): Promise<HealthResponse> {
    return http<HealthResponse>("/health", { signal });
  },
};
