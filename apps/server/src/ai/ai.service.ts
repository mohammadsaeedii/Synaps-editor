import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ChatRequestDto } from './dto/chat.dto';
import {
  AI_MODELS,
  PROVIDER_META,
  defaultModelFor,
  resolveProviderForModel,
} from './providers/catalog';
import { getProvider } from './providers/registry';
import type { AiProviderId } from './providers/types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  listModels() {
    return {
      providers: Object.values(PROVIDER_META).map((p) => ({
        id: p.id,
        label: p.label,
        envConfigured: Boolean(process.env[p.envKey]?.trim()),
      })),
      models: AI_MODELS,
    };
  }

  async streamChat(
    dto: ChatRequestDto,
    clientApiKey: string | undefined,
    req: Request,
    res: Response,
  ): Promise<void> {
    if (!dto.messages?.length) {
      throw new BadRequestException('messages must not be empty');
    }

    const providerId = resolveProviderForModel(dto.model, dto.provider);
    const model = dto.model || defaultModelFor(providerId);
    const apiKey = this.resolveApiKey(providerId, clientApiKey);

    if (!apiKey) {
      const meta = PROVIDER_META[providerId];
      throw new UnauthorizedException(
        `${meta.label} API key required. Set it in Settings or ${meta.envKey} on the server.`,
      );
    }

    const abort = new AbortController();
    const onClose = () => abort.abort();
    req.on('close', onClose);

    this.writeSseHeaders(res);

    try {
      const provider = getProvider(providerId);
      await provider.streamChat({
        messages: dto.messages,
        system: dto.system,
        model,
        maxTokens: dto.maxTokens ?? 2048,
        apiKey,
        signal: abort.signal,
        onDelta: (text) => this.writeSse(res, { type: 'delta', text }),
      });

      if (!abort.signal.aborted && !res.writableEnded) {
        this.writeSse(res, { type: 'done', provider: providerId, model });
      }
    } catch (err) {
      if (abort.signal.aborted) return;
      this.logger.error(`Provider ${providerId} failed`, err);
      const message =
        err instanceof Error ? err.message : 'AI provider stream error';
      const status =
        typeof err === 'object' &&
        err &&
        'status' in err &&
        typeof (err as { status?: number }).status === 'number'
          ? (err as { status: number }).status
          : 502;

      if (!res.headersSent) {
        res.status(status === 401 ? 401 : 502).json({ message });
        return;
      }
      if (!res.writableEnded) {
        this.writeSse(res, { type: 'error', message });
      }
    } finally {
      req.off('close', onClose);
      if (!res.writableEnded) res.end();
    }
  }

  private resolveApiKey(
    provider: AiProviderId,
    clientKey: string | undefined,
  ): string | undefined {
    const fromClient = clientKey?.trim();
    if (fromClient) return fromClient;
    const envName = PROVIDER_META[provider].envKey;
    return process.env[envName]?.trim() || undefined;
  }

  private writeSseHeaders(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
  }

  private writeSse(res: Response, payload: Record<string, unknown>): void {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}
