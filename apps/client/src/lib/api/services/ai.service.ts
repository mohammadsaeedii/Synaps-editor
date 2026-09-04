import { ApiError } from "../errors";
import { httpStream } from "../http-client";
import type { ChatStreamEvent, ChatStreamRequest } from "../types";

export interface StreamChatOptions {
  apiKey?: string;
  signal?: AbortSignal;
  onEvent: (event: ChatStreamEvent) => void;
}

/**
 * Streams a chat completion from the Nest API (SSE).
 * Emits typed events: delta | done | error.
 */
export async function streamChat(
  request: ChatStreamRequest,
  { apiKey, signal, onEvent }: StreamChatOptions,
): Promise<void> {
  const res = await httpStream("/ai/chat", {
    body: {
      messages: request.messages,
      system: request.system,
      model: request.model,
      provider: request.provider,
      maxTokens: request.maxTokens,
    },
    apiKey,
    signal,
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        await handleSseLine(line, onEvent);
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* already released */
    }
  }
}

async function handleSseLine(
  line: string,
  onEvent: (event: ChatStreamEvent) => void,
): Promise<void> {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith("data:")) return;

  const data = trimmed.slice(5).trim();
  if (!data) return;

  let event: ChatStreamEvent;
  try {
    event = JSON.parse(data) as ChatStreamEvent;
  } catch {
    return;
  }

  if (event.type === "error") {
    throw new ApiError(event.message || "stream error", 502);
  }

  onEvent(event);
}

export const aiService = {
  streamChat,
};
