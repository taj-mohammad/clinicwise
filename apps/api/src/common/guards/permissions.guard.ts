import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@cliniqx/shared';
import { PERMISSIONS_KEY } from '../decorators';
import type { Actor } from '../actor';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;

    const req = ctx.switchToHttp().getRequest();
    const actor: Actor | undefined = req.actor;
    if (!actor) throw new ForbiddenException('Not authorised');

    const missing = required.filter((p) => !actor.permissions.has(p));
    if (missing.length === 0) return true;

    await this.audit.security('PERMISSION_DENIED', {
      userId: actor.userId,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      severity: 'warning',
      metadata: { required, missing, path: req.originalUrl, method: req.method },
    });
    // The message never reveals which permission is missing.
    throw new ForbiddenException('You do not have access to this resource');
  }
}
