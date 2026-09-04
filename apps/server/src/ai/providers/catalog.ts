import type { AiProviderId, ModelDefinition } from './types';

/** Canonical model catalog — Cursor-style provider + model switching. */
export const AI_MODELS: ModelDefinition[] = [
  // Anthropic
  {
    id: 'claude-opus-4-8',
    label: 'Claude Opus 4.8',
    provider: 'anthropic',
    shortLabel: 'Opus 4.8',
  },
  {
    id: 'claude-sonnet-4-6',
    label: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    shortLabel: 'Sonnet 4.6',
  },
  {
    id: 'claude-haiku-4-5',
    label: 'Claude Haiku 4.5',
    provider: 'anthropic',
    shortLabel: 'Haiku 4.5',
  },
  // OpenAI
  {
    id: 'gpt-4.1',
    label: 'GPT-4.1',
    provider: 'openai',
    shortLabel: 'GPT-4.1',
  },
  {
    id: 'gpt-4.1-mini',
    label: 'GPT-4.1 Mini',
    provider: 'openai',
    shortLabel: '4.1 Mini',
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    provider: 'openai',
    shortLabel: 'GPT-4o',
  },
  {
    id: 'o4-mini',
    label: 'o4-mini',
    provider: 'openai',
    shortLabel: 'o4-mini',
  },
  // Google
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    provider: 'google',
    shortLabel: 'Gemini Pro',
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    provider: 'google',
    shortLabel: 'Gemini Flash',
  },
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    provider: 'google',
    shortLabel: '2.0 Flash',
  },
];

export const PROVIDER_META: Record<
  AiProviderId,
  { id: AiProviderId; label: string; envKey: string }
> = {
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
  },
  openai: { id: 'openai', label: 'OpenAI', envKey: 'OPENAI_API_KEY' },
  google: { id: 'google', label: 'Google', envKey: 'GOOGLE_API_KEY' },
};

export function resolveProviderForModel(
  model: string | undefined,
  explicit?: AiProviderId,
): AiProviderId {
  if (explicit) return explicit;
  const found = AI_MODELS.find((m) => m.id === model);
  if (found) return found.provider;
  if (model?.startsWith('gpt-') || model?.startsWith('o1') || model?.startsWith('o3') || model?.startsWith('o4'))
    return 'openai';
  if (model?.startsWith('gemini-')) return 'google';
  return 'anthropic';
}

export function defaultModelFor(provider: AiProviderId): string {
  const first = AI_MODELS.find((m) => m.provider === provider);
  return first?.id ?? 'claude-opus-4-8';
}
