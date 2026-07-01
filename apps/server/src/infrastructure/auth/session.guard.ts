import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export type AuthedRequest = Request & { user: AuthenticatedUser };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.["synapse.session"] ?? req.headers.authorization?.replace("Bearer ", "");
    if (!token) throw new UnauthorizedException("No session");

    const user = await this.auth.validateSession(token);
    if (!user) throw new UnauthorizedException("Invalid session");

    (req as AuthedRequest).user = user;
    return true;
  }
}
