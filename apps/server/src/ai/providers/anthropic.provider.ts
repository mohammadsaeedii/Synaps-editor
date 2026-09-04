import { BadRequestException } from '@nestjs/common';
import type { AiProvider, StreamChatParams } from './types';

type AnthropicSseEvent = {
  type?: string;
  delta?: { type?: string; text?: string };
  error?: { message?: string };
};

export class AnthropicProvider implements AiProvider {
  readonly id = 'anthropic' as const;
  readonly label = 'Anthropic';

  async streamChat(params: StreamChatParams): Promise<void> {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: params.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': params.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: params.model,
        max_tokens: params.maxTokens,
        stream: true,
        ...(params.system ? { system: params.system } : {}),
        messages: params.messages,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      throw await this.toHttpError(upstream, 'Anthropic');
    }

    await this.readSse(upstream.body, (line) => {
      if (!line.startsWith('data:')) return;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') return;
      let event: AnthropicSseEvent;
      try {
        event = JSON.parse(data) as AnthropicSseEvent;
      } catch {
        return;
      }
      if (
        event.type === 'content_block_delta' &&
        event.delta?.type === 'text_delta' &&
        event.delta.text
      ) {
        params.onDelta(event.delta.text);
      } else if (event.type === 'error') {
        throw new BadRequestException(
          event.error?.message || 'Anthropic stream error',
        );
      }
    });
  }

  private async toHttpError(res: Response, name: string): Promise<Error> {
    let message = `${name} API error (HTTP ${res.status})`;
    try {
      const json = (await res.json()) as { error?: { message?: string } };
      if (json?.error?.message) message = json.error.message;
    } catch {
      /* ignore */
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    return err;
  }

  private async readSse(
    body: ReadableStream<Uint8Array>,
    onLine: (line: string) => void,
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let i: number;
        while ((i = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, i);
          buffer = buffer.slice(i + 1);
          onLine(line);
        }
      }
    } finally {
      try {
        reader.releaseLock();
      } catch {
        /* ignore */
      }
    }
  }
}
