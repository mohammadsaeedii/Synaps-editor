/* =========================================================================
   synapse · AI engine (pluggable, multi-provider)
   Offline mock by default; live mode streams through Nest when a key exists
   for the active model's provider (Anthropic / OpenAI / Google).
   ========================================================================= */
import {
  findModel,
  providerLabel,
  resolveProviderForModel,
  type AiProviderId,
} from "./ai/catalog";
import { aiService } from "./api/services/ai.service";
import { buildCodeContext } from "./engine";
import { store } from "./store/store";

export interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RunOptions {
  system?: string;
  model?: string;
  provider?: AiProviderId;
  signal?: AbortSignal;
  onChunk: (text: string) => void;
  /** When true (default), append code-aware context from the IDE engine. */
  codeAware?: boolean;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function activeModelId(override?: string | null): string {
  return override || store.settings().model || "claude-opus-4-8";
}

export function activeProviderId(modelOverride?: string | null): AiProviderId {
  const model = activeModelId(modelOverride);
  const s = store.settings();
  return resolveProviderForModel(model, s.provider);
}

export function apiKeyForProvider(provider: AiProviderId): string {
  const s = store.settings();
  const fromMap = s.apiKeys?.[provider]?.trim();
  if (fromMap) return fromMap;
  // Legacy fallback
  if (provider === "anthropic") return s.apiKey?.trim() || "";
  return "";
}

/** True when the active provider has an API key. */
export function isLive(modelOverride?: string | null): boolean {
  const provider = activeProviderId(modelOverride);
  return !!apiKeyForProvider(provider);
}

export function statusText(modelOverride?: string | null): string {
  if (!isLive(modelOverride)) return "Offline demo";
  const provider = activeProviderId(modelOverride);
  const model = findModel(activeModelId(modelOverride));
  return `Live · ${providerLabel(provider)}${model ? ` · ${model.shortLabel || model.label}` : ""}`;
}

/** Build an API-shaped history from a chat's messages (drop meta + leading assistant). */
export function apiHistory(
  messages: { role: "user" | "assistant"; text: string; meta?: boolean }[],
): ApiMessage[] {
  const msgs = messages.filter((m) => !m.meta).map((m) => ({ role: m.role, content: m.text }));
  while (msgs.length && msgs[0].role === "assistant") msgs.shift();
  return msgs;
}

async function streamViaBackend(
  history: ApiMessage[],
  { system, model, provider, onChunk, signal, codeAware = true }: RunOptions,
): Promise<void> {
  const s = store.settings();
  const resolvedModel = model || s.model || "claude-opus-4-8";
  const resolvedProvider = resolveProviderForModel(resolvedModel, provider || s.provider);
  const apiKey = apiKeyForProvider(resolvedProvider);
  const ctx = codeAware ? buildCodeContext() : null;
  const mergedSystem = [system, ctx?.systemAppend].filter(Boolean).join("\n\n");

  await aiService.streamChat(
    {
      messages: history,
      system: mergedSystem || undefined,
      model: resolvedModel,
      provider: resolvedProvider,
      maxTokens: 2048,
    },
    {
      apiKey,
      signal,
      onEvent: (event) => {
        if (event.type === "delta") onChunk(event.text);
      },
    },
  );
}

function mockReply(prompt: string): string {
  const p = (prompt || "").toLowerCase();
  const has = (...k: string[]) => k.some((w) => p.includes(w));
  if (has("hello", "hi ", "hey", "good morning", "good evening") || p.trim() === "hi")
    return "Hello! I'm running in offline demo mode, but I'm happy to help. Ask me to summarize text, brainstorm, explain a concept, or draft some code.\n\nTip: add a provider API key in Settings → AI for real answers.";
  if (has("summar", "tl;dr", "shorten"))
    return "Here's a concise summary:\n\n• The core idea in a sentence or two.\n• Supporting details trimmed to what matters.\n• The takeaway, stated plainly.\n\n(Demo mode — connect a provider key in Settings for a real summary.)";
  if (has("code", "function", "bug", "refactor", "javascript", "python", "react"))
    return 'Here\'s a small example to start from:\n\n```js\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet("world"));\n```\n\nTell me what you\'re building and I\'ll tailor it. (Demo mode — add a provider key in Settings for full coding help.)';
  if (has("idea", "brainstorm", "suggest", "name"))
    return "A few directions to spark things:\n\n1. Start from the user's biggest frustration and remove a step.\n2. Combine two familiar things in an unexpected way.\n3. Make the boring part delightful.\n\nWant me to expand any of these? (Offline demo.)";
  if (has("explain", "what is", "how does", "why"))
    return "Good question. The short version:\n\nThink of it as a tool that takes an input, applies a clear rule, and returns a useful output — the value is choosing the right rule for the job. Tell me the specific case and I'll go deeper.\n\n(Demo mode — add a provider API key for a precise answer.)";
  return "Got it — I'm in offline demo mode, so this is a placeholder reply that streams in like the real thing. Add a provider API key in Settings → AI and I'll answer for real, with full context from this conversation.\n\nWhat would you like to do next?";
}

async function streamMock(history: ApiMessage[], { onChunk, signal }: RunOptions): Promise<void> {
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  await delay(260 + Math.random() * 240);
  const text = mockReply(lastUser ? lastUser.content : "");
  const tokens = text.match(/\s+|\S+/g) || [text];
  for (const t of tokens) {
    if (signal?.aborted) throw new DOMException("aborted", "AbortError");
    onChunk(t);
    await delay(10 + Math.random() * 24);
  }
}

/** Run the engine: Nest-proxied provider if a key is set, otherwise the offline mock. */
export async function runAI(history: ApiMessage[], opts: RunOptions): Promise<void> {
  if (isLive(opts.model)) return streamViaBackend(history, opts);
  return streamMock(history, opts);
}

export {
  AI_MODELS,
  AI_PROVIDERS,
  modelDisplayLabel,
  modelPickerGroups,
  resolveProviderForModel,
} from "./ai/catalog";
export type { AiProviderId } from "./ai/catalog";
