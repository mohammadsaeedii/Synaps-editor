import { Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { aiStreamRequestSchema } from "@synapse/shared";
import { AiGatewayService } from "../infrastructure/ai/ai-gateway.service";
import { SessionGuard, type AuthedRequest } from "../infrastructure/auth/session.guard";
import { RedisService } from "../infrastructure/redis/redis.service";

/**
 * SSE endpoint: POST /api/ai/stream
 *
 * Request body: AiStreamRequest (JSON)
 * Response: text/event-stream
 *
 * Events:
 *   event: token   data: {"text":"..."}
 *   event: done    data: {"usage":{...}}
 *   event: error   data: {"message":"..."}
 *
 * Cancellation: client closes connection → AbortController aborts upstream fetch
 */
@Controller("ai")
@UseGuards(SessionGuard)
export class AiStreamController {
  constructor(
    private readonly ai: AiGatewayService,
    private readonly redis: RedisService,
  ) {}

  @Post("stream")
  async stream(@Req() req: AuthedRequest, @Res() res: Response) {
    const parsed = aiStreamRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(parsed.error.flatten());
      return;
    }

    const rlKey = this.redis.rateLimitKey(req.user.id, "ai-stream");
    const count = await this.redis.client.incr(rlKey);
    if (count === 1) await this.redis.client.expire(rlKey, 60);
    if (count > 30) {
      res.status(429).json({ message: "Rate limit exceeded" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const ac = new AbortController();
    req.on("close", () => ac.abort());

    const write = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      await this.ai.stream(req.user.id, parsed.data, ac.signal, {
        onToken: (text) => write("token", { text }),
        onDone: (usage) => {
          write("done", { usage });
          res.end();
        },
        onError: (error) => {
          write("error", { message: error.message });
          res.end();
        },
      });
    } catch (err) {
      write("error", { message: err instanceof Error ? err.message : "Stream failed" });
      res.end();
    }
  }
}
