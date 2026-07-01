import { Inject, Injectable } from "@nestjs/common";
import type Redis from "ioredis";
import { REDIS_CLIENT } from "./redis.constants";

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  get client(): Redis {
    return this.redis;
  }

  async quit(): Promise<void> {
    await this.redis.quit();
  }

  /** Session store helpers */
  sessionKey(token: string) {
    return `session:${token}`;
  }

  /** Rate limit key */
  rateLimitKey(userId: string, action: string) {
    return `rl:${userId}:${action}`;
  }

  /** SSE fanout channel for agent runs */
  agentStreamChannel(runId: string) {
    return `agent:stream:${runId}`;
  }
}
