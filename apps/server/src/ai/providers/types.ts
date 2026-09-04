export type AiProviderId = 'anthropic' | 'openai' | 'google';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamChatParams {
  messages: ChatMessage[];
  system?: string;
  model: string;
  maxTokens: number;
  apiKey: string;
  signal: AbortSignal;
  onDelta: (text: string) => void;
}

export interface AiProvider {
  readonly id: AiProviderId;
  readonly label: string;
  streamChat(params: StreamChatParams): Promise<void>;
}

export interface ModelDefinition {
  id: string;
  label: string;
  provider: AiProviderId;
  /** Short badge in pickers, e.g. "Opus" */
  shortLabel?: string;
}
