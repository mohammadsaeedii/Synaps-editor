import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { AuthenticatedUser } from "../infrastructure/auth/session.guard";
import type { PrismaService } from "../infrastructure/database/prisma.service";
import type { AuthService } from "../infrastructure/auth/auth.service";
import type { QueueService } from "../infrastructure/queue/queue.service";
import type { AiGatewayService } from "../infrastructure/ai/ai-gateway.service";

export interface TrpcContext {
  user: AuthenticatedUser | null;
  prisma: PrismaService;
  auth: AuthService;
  queue: QueueService;
  ai: AiGatewayService;
  sessionToken: string | null;
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

