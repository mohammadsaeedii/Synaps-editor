import { BadRequestException } from '@nestjs/common';
import type { AiProvider, StreamChatParams } from './types';

type OpenAiSseChunk = {
  choices?: Array<{ delta?: { content?: string } }>;
  error?: { message?: string };
};

export class OpenAiProvider implements AiProvider {
  readonly id = 'openai' as const;
  readonly label = 'OpenAI';

  async streamChat(params: StreamChatParams): Promise<void> {
    const messages = [
      ...(params.system
        ? [{ role: 'system' as const, content: params.system }]
        : []),
      ...params.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: params.signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        max_tokens: params.maxTokens,
        stream: true,
        messages,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      throw await this.toHttpError(upstream, 'OpenAI');
    }

    await this.readSse(upstream.body, (line) => {
      if (!line.startsWith('data:')) return;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') return;
      let chunk: OpenAiSseChunk;
      try {
        chunk = JSON.parse(data) as OpenAiSseChunk;
      } catch {
        return;
      }
      if (chunk.error?.message) {
        throw new BadRequestException(chunk.error.message);
      }
      const text = chunk.choices?.[0]?.delta?.content;
      if (text) params.onDelta(text);
    });
  }

  private async toHttpError(res: Response, name: string): Promise<Error> {
    let message = `${name} API error (HTTP ${res.status})`;
    try {
      const json = (await res.json()) as {
        error?: { message?: string };
      };
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
