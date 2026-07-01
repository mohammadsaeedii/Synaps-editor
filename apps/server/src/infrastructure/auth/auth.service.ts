import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../database/prisma.service";
import { RedisService } from "../redis/redis.service";
import type { AuthenticatedUser } from "./session.guard";

const SESSION_TTL_SEC = 60 * 60 * 24 * 30; // 30 days

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async createSession(userId: string): Promise<string> {
    const token = randomBytes(32).toString("hex");
    const key = this.redis.sessionKey(token);
    await this.redis.client.setex(key, SESSION_TTL_SEC, userId);
    return token;
  }

  async validateSession(token: string): Promise<AuthenticatedUser | null> {
    const userId = await this.redis.client.get(this.redis.sessionKey(token));
    if (!userId) return null;

    const user = await this.prisma.db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    return user;
  }

  async destroySession(token: string): Promise<void> {
    await this.redis.client.del(this.redis.sessionKey(token));
  }

  /**
   * Auth flow (Phase 1):
   * 1. Next.js Auth.js handles OAuth/credentials on Vercel
   * 2. On sign-in callback, Next.js calls POST /api/auth/exchange with Auth.js JWT
   * 3. Server validates JWT, upserts User, returns httpOnly synapse.session cookie
   * 4. All tRPC + SSE requests carry cookie; SessionGuard validates via Redis
   */
}
