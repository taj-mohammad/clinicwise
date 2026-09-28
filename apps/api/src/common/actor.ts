import type { Permission, SystemRole } from '@cliniqx/shared';

/** Everything the API knows about the caller, resolved once per request. */
export interface Actor {
  userId: string;
  organizationId: string | null;
  principalType: 'PLATFORM' | 'ORG' | 'CLINIC' | 'PATIENT' | 'MR' | 'PHARMACY' | 'LAB';
  roles: SystemRole[];
  permissions: Set<Permission>;
  /** Clinics this user holds any role in. Empty for platform admins, who see all. */
  clinicIds: string[];
  /** Populated for role-specific principals so ownership checks need no extra query. */
  doctorId?: string | null;
  staffId?: string | null;
  patientId?: string | null;
  mrUserId?: string | null;
  pharmacyIds?: string[];
  labIds?: string[];
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}

export function isPlatformAdmin(actor: Actor): boolean {
  return actor.principalType === 'PLATFORM';
}

export function can(actor: Actor, permission: Permission): boolean {
  return actor.permissions.has(permission);
}

/** Platform admins are unscoped; everyone else must hold a role in the clinic. */
export function canAccessClinic(actor: Actor, clinicId: string | null | undefined): boolean {
  if (!clinicId) return false;
  if (isPlatformAdmin(actor)) return true;
  return actor.clinicIds.includes(clinicId);
}
