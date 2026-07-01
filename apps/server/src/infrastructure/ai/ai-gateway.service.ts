import { Injectable } from "@nestjs/common";
import type { AiStreamRequest, TokenUsage } from "@synapse/shared";
import { env } from "../../config/env";
import { PrismaService } from "../database/prisma.service";
import { EncryptionService } from "../auth/encryption.service";

export interface StreamChunkHandler {
  onToken(text: string): void;
  onDone(usage: TokenUsage): void;
  onError(error: Error): void;
}

/**
 * AI Gateway — sole path to Anthropic. Keys never leave the server.
 *
 * Flow:
 *   SSE Controller → AiGatewayService.stream() → Anthropic Messages API
 *   → transform SSE events → write to client SSE
 *   → on completion: persist Message rows + TokenUsageLog
 */
@Injectable()
export class AiGatewayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  async resolveApiKey(userId: string): Promise<string> {
    const stored = await this.prisma.db.encryptedApiKey.findUnique({
      where: { userId_provider: { userId, provider: "anthropic" } },
    });
    if (stored) {
      return this.encryption.decrypt(Buffer.from(stored.keyCiphertext), Buffer.from(stored.keyIv));
    }
    if (env.ANTHROPIC_API_KEY) return env.ANTHROPIC_API_KEY;
    throw new Error("No Anthropic API key configured");
  }

  async stream(userId: string, req: AiStreamRequest, signal: AbortSignal, handler: StreamChunkHandler): Promise<void> {
    const apiKey = await this.resolveApiKey(userId);
    const system = [req.system, req.codeContext].filter(Boolean).join("\n\n");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: req.model ?? "claude-opus-4-8",
        max_tokens: 4096,
        stream: true,
        ...(system ? { system } : {}),
        messages: req.messages,
      }),
    });

    if (!res.ok || !res.body) {
      const err = await res.text();
      throw new Error(err || `Anthropic HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let inputTokens = 0;
    let outputTokens = 0;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });

      let i: number;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;

        const ev = JSON.parse(data) as {
          type?: string;
          delta?: { type?: string; text?: string };
          message?: { usage?: { input_tokens?: number; output_tokens?: number } };
          usage?: { input_tokens?: number; output_tokens?: number };
        };

        if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
          handler.onToken(ev.delta.text ?? "");
        }
        if (ev.type === "message_start" && ev.message?.usage) {
          inputTokens = ev.message.usage.input_tokens ?? 0;
        }
        if (ev.type === "message_delta" && ev.usage) {
          outputTokens = ev.usage.output_tokens ?? 0;
        }
      }
    }

    const usage: TokenUsage = {
      inputTokens,
      outputTokens,
      model: req.model ?? "claude-opus-4-8",
    };

    await this.prisma.db.tokenUsageLog.create({
      data: {
        userId,
        chatId: req.chatId ?? null,
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    });

    handler.onDone(usage);
  }
}
