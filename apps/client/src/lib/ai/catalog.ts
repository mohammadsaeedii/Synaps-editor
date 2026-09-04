/* =========================================================================
   synapse · AI model catalog (mirrors server /api/ai/models)
   Used for pickers before/without a network round-trip.
   ========================================================================= */

export type AiProviderId = "anthropic" | "openai" | "google";

export interface AiModelDef {
  id: string;
  label: string;
  provider: AiProviderId;
  shortLabel?: string;
}

export interface AiProviderMeta {
  id: AiProviderId;
  label: string;
  placeholder: string;
}

export const AI_PROVIDERS: AiProviderMeta[] = [
  { id: "anthropic", label: "Anthropic", placeholder: "sk-ant-…" },
  { id: "openai", label: "OpenAI", placeholder: "sk-…" },
  { id: "google", label: "Google", placeholder: "AIza…" },
];

export const AI_MODELS: AiModelDef[] = [
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", provider: "anthropic", shortLabel: "Opus 4.8" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic", shortLabel: "Sonnet 4.6" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "anthropic", shortLabel: "Haiku 4.5" },
  { id: "gpt-4.1", label: "GPT-4.1", provider: "openai", shortLabel: "GPT-4.1" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "openai", shortLabel: "4.1 Mini" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai", shortLabel: "GPT-4o" },
  { id: "o4-mini", label: "o4-mini", provider: "openai", shortLabel: "o4-mini" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "google", shortLabel: "Gemini Pro" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "google", shortLabel: "Gemini Flash" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "google", shortLabel: "2.0 Flash" },
];

export type ProviderApiKeys = Record<AiProviderId, string>;

export function emptyApiKeys(): ProviderApiKeys {
  return { anthropic: "", openai: "", google: "" };
}

export function resolveProviderForModel(
  model: string | undefined | null,
  explicit?: AiProviderId | null,
): AiProviderId {
  if (explicit) return explicit;
  const found = AI_MODELS.find((m) => m.id === model);
  if (found) return found.provider;
  if (!model) return "anthropic";
  if (model.startsWith("gpt-") || model.startsWith("o1") || model.startsWith("o3") || model.startsWith("o4"))
    return "openai";
  if (model.startsWith("gemini-")) return "google";
  return "anthropic";
}

export function findModel(modelId: string | undefined | null): AiModelDef | undefined {
  return AI_MODELS.find((m) => m.id === modelId);
}

export function modelsByProvider(provider: AiProviderId): AiModelDef[] {
  return AI_MODELS.filter((m) => m.provider === provider);
}

export function providerLabel(id: AiProviderId): string {
  return AI_PROVIDERS.find((p) => p.id === id)?.label ?? id;
}

export function modelPickerGroups(): { provider: AiProviderMeta; models: AiModelDef[] }[] {
  return AI_PROVIDERS.map((provider) => ({
    provider,
    models: modelsByProvider(provider.id),
  }));
}

export function modelDisplayLabel(modelId: string | undefined | null): string {
  if (!modelId) return "Workspace default";
  const m = findModel(modelId);
  return m?.shortLabel || m?.label || modelId;
}
