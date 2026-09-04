"use client";

import { useMutation } from "@tanstack/react-query";
import { aiService } from "../services/ai.service";
import type { ChatStreamRequest } from "../types";

export interface ChatStreamMutationInput extends ChatStreamRequest {
  apiKey?: string;
  signal?: AbortSignal;
  onChunk: (text: string) => void;
}

/**
 * React Query mutation wrapping the SSE chat stream.
 * Prefer this from React components; imperative callers can use `aiService` / `runAI`.
 */
export function useChatStreamMutation() {
  return useMutation({
    mutationKey: ["ai", "chat", "stream"],
    mutationFn: async ({
      apiKey,
      signal,
      onChunk,
      ...request
    }: ChatStreamMutationInput) => {
      await aiService.streamChat(request, {
        apiKey,
        signal,
        onEvent: (event) => {
          if (event.type === "delta") onChunk(event.text);
        },
      });
    },
  });
}
