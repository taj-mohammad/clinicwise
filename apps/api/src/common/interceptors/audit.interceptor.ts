import { CallHandler, ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tap } from 'rxjs';
import { AUDIT_KEY, type AuditSpec } from '../decorators';
import { AuditService } from '../../modules/audit/audit.service';
import type { Actor } from '../actor';

/** Writes an audit row for any handler marked with `@Audited`, after it succeeds. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler) {
    const spec = this.reflector.get<AuditSpec | undefined>(AUDIT_KEY, ctx.getHandler());
    if (!spec) return next.handle();

    const req = ctx.switchToHttp().getRequest();
    const actor: Actor | undefined = req.actor;

    return next.handle().pipe(
      tap((result) => {
        const resourceId =
          req.params?.[spec.idParam ?? 'id'] ??
          (result && typeof result === 'object' && 'id' in result ? String(result.id) : null);

        void this.audit.record({
          organizationId: actor?.organizationId ?? null,
          userId: actor?.userId ?? null,
          action: spec.action,
          resourceType: spec.resourceType,
          resourceId,
          patientId: spec.phi
            ? (req.params?.patientId ?? req.body?.patientId ?? actor?.patientId ?? null)
            : null,
          ipAddress: req.ip,
          userAgent: req.get?.('user-agent') ?? null,
          metadata: { method: req.method, path: req.originalUrl },
        });
      }),
    );
  }
}
