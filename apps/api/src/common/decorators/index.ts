import { SetMetadata, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Permission } from '@cliniqx/shared';
import type { Actor } from '../actor';

export const IS_PUBLIC_KEY = 'cliniqx:isPublic';
/** Opts a route out of authentication. Use sparingly and never for PHI. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const PERMISSIONS_KEY = 'cliniqx:permissions';
/** Caller must hold every listed permission. */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const AUDIT_KEY = 'cliniqx:audit';
export interface AuditSpec {
  action: string;
  resourceType: string;
  /** Route param holding the resource id, defaults to `id`. */
  idParam?: string;
  /** Marks the route as touching protected health information. */
  phi?: boolean;
}
export const Audited = (spec: AuditSpec) => SetMetadata(AUDIT_KEY, spec);

export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Actor => ctx.switchToHttp().getRequest().actor,
);
