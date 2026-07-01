import { All, Controller, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./app.router";
import { AuthService } from "../infrastructure/auth/auth.service";
import { PrismaService } from "../infrastructure/database/prisma.service";
import { QueueService } from "../infrastructure/queue/queue.service";
import { AiGatewayService } from "../infrastructure/ai/ai-gateway.service";

@Controller("trpc")
export class TrpcController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly ai: AiGatewayService,
  ) {}

  @All("*path")
  async handler(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.["synapse.session"] ?? null;
    const user = token ? await this.auth.validateSession(token) : null;

    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: req as unknown as Request,
      router: appRouter,
      createContext: () => ({
        user,
        prisma: this.prisma,
        auth: this.auth,
        queue: this.queue,
        ai: this.ai,
        sessionToken: token,
      }),
    });

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(Buffer.from(await response.arrayBuffer()));
  }
}
