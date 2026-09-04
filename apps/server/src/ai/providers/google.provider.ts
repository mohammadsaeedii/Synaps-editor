import { BadRequestException } from '@nestjs/common';
import type { AiProvider, ChatMessage, StreamChatParams } from './types';

type GeminiPart = { text?: string };
type GeminiCandidate = { content?: { parts?: GeminiPart[] } };
type GeminiChunk = {
  candidates?: GeminiCandidate[];
  error?: { message?: string };
};

export class GoogleProvider implements AiProvider {
  readonly id = 'google' as const;
  readonly label = 'Google';

  async streamChat(params: StreamChatParams): Promise<void> {
    const { systemInstruction, contents } = this.toGeminiContents(
      params.messages,
      params.system,
    );

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(params.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(params.apiKey)}`;

    const upstream = await fetch(url, {
      method: 'POST',
      signal: params.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents,
        ...(systemInstruction
          ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
          : {}),
        generationConfig: { maxOutputTokens: params.maxTokens },
      }),
    });

    if (!upstream.ok || !upstream.body) {
      throw await this.toHttpError(upstream, 'Google');
    }

    await this.readSse(upstream.body, (line) => {
      if (!line.startsWith('data:')) return;
      const data = line.slice(5).trim();
      if (!data) return;
      let chunk: GeminiChunk;
      try {
        chunk = JSON.parse(data) as GeminiChunk;
      } catch {
        return;
      }
      if (chunk.error?.message) {
        throw new BadRequestException(chunk.error.message);
      }
      const parts = chunk.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.text) params.onDelta(part.text);
      }
    });
  }

  /** Gemini wants alternating user/model turns; map assistant → model. */
  private toGeminiContents(
    messages: ChatMessage[],
    system?: string,
  ): {
    systemInstruction?: string;
    contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  } {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> =
      [];
    for (const m of messages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      const last = contents[contents.length - 1];
      if (last && last.role === role) {
        last.parts[0].text += '\n' + m.content;
      } else {
        contents.push({ role, parts: [{ text: m.content }] });
      }
    }
    return { systemInstruction: system, contents };
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
