import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators';
import { TokenService } from '../../modules/auth/token.service';
import { ActorService } from '../../modules/auth/actor.service';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly actors: ActorService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request & { actor?: unknown }>();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('Authentication required');

    const payload = await this.tokens.verifyAccess(token);

    const session = await this.prisma.userSession.findUnique({
      where: { id: payload.sid },
      select: { revokedAt: true, expiresAt: true, userId: true },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session is no longer valid');
    }
    if (session.userId !== payload.sub) throw new UnauthorizedException('Session mismatch');

    // Honours "log out of all devices" without waiting for tokens to expire.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { tokensValidFrom: true },
    });
    if (!user) throw new UnauthorizedException('Account not found');
    if (payload.iat && payload.iat * 1000 < user.tokensValidFrom.getTime()) {
      throw new UnauthorizedException('Session was invalidated');
    }

    const actor = await this.actors.build(payload.sub, payload.sid, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    if (!actor) throw new UnauthorizedException('Account is not active');

    req.actor = actor;
    return true;
  }

  /** Cookie first (browser clients), bearer header second (mobile and service calls). */
  private extractToken(req: Request): string | null {
    const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.[
      'cliniqx_access'
    ];
    if (cookie) return cookie;
    const header = req.get('authorization');
    if (header?.toLowerCase().startsWith('bearer ')) return header.slice(7).trim();
    return null;
  }
}
