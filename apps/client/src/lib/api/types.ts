export type ChatRole = "user" | "assistant";

export interface ApiChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatStreamRequest {
  messages: ApiChatMessage[];
  system?: string;
  model?: string;
  provider?: "anthropic" | "openai" | "google";
  maxTokens?: number;
}

export type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; provider?: string; model?: string }
  | { type: "error"; message: string };

export interface HealthResponse {
  status: "ok";
  service: string;
  anthropicConfigured: boolean;
  providers?: Array<{ id: string; label: string; configured: boolean }>;
  timestamp: string;
}

export interface AiModelsResponse {
  providers: Array<{ id: string; label: string; envConfigured: boolean }>;
  models: Array<{
    id: string;
    label: string;
    provider: "anthropic" | "openai" | "google";
    shortLabel?: string;
  }>;
}
