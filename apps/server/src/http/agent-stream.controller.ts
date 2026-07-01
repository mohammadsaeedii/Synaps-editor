import { Controller, Get, Param, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { SessionGuard, type AuthedRequest } from "../infrastructure/auth/session.guard";
import { REDIS_CLIENT } from "../infrastructure/redis/redis.constants";
import { Inject } from "@nestjs/common";
import type Redis from "ioredis";

/** SSE fanout for agent run progress via Redis pub/sub. */
@Controller("agents")
@UseGuards(SessionGuard)
export class AgentStreamController {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  @Get("runs/:runId/stream")
  async stream(@Param("runId") runId: string, @Req() req: AuthedRequest, @Res() res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const channel = `agent:stream:${runId}`;
    const sub = this.redis.duplicate();
    await sub.subscribe(channel);

    const onMessage = (_ch: string, message: string) => {
      res.write(`event: log\ndata: ${message}\n\n`);
    };

    sub.on("message", onMessage);
    req.on("close", async () => {
      sub.off("message", onMessage);
      await sub.unsubscribe(channel);
      await sub.quit();
    });
  }
}
