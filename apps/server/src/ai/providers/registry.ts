import type { AiProvider, AiProviderId } from './types';
import { AnthropicProvider } from './anthropic.provider';
import { OpenAiProvider } from './openai.provider';
import { GoogleProvider } from './google.provider';

const providers: Record<AiProviderId, AiProvider> = {
  anthropic: new AnthropicProvider(),
  openai: new OpenAiProvider(),
  google: new GoogleProvider(),
};

export function getProvider(id: AiProviderId): AiProvider {
  const p = providers[id];
  if (!p) throw new Error(`Unknown AI provider: ${id}`);
  return p;
}

export function listProviders(): AiProvider[] {
  return Object.values(providers);
}
