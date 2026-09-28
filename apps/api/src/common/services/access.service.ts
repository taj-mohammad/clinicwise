import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';
import { PERMISSIONS } from '@cliniqx/shared';
import { type Actor, canAccessClinic, isPlatformAdmin } from '../actor';

/**
 * Central resource authorisation. Every handler that loads a tenant-owned row
 * routes through here so IDOR protection is one implementation, not dozens.
 */
@Injectable()
export class AccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Prisma `where` fragment restricting a clinic-scoped query to the actor's clinics. */
  clinicScope(actor: Actor): { clinicId?: { in: string[] } } {
    if (isPlatformAdmin(actor)) return {};
    return { clinicId: { in: actor.clinicIds.length ? actor.clinicIds : ['__none__'] } };
  }

  async assertClinic(actor: Actor, clinicId: string | null | undefined): Promise<void> {
    if (canAccessClinic(actor, clinicId)) return;
    await this.recordViolation(actor, 'clinic', clinicId);
    throw new ForbiddenException('You do not have access to this resource');
  }

  /**
   * Resolves a patient the actor is allowed to see. Access comes from one of:
   * the patient themselves, a treating doctor, clinic staff with the permission,
   * or a platform admin.
   */
  async assertPatientAccess(actor: Actor, patientId: string): Promise<void> {
    if (isPlatformAdmin(actor)) return;

    if (actor.principalType === 'PATIENT') {
      if (actor.patientId === patientId) return;
      await this.recordViolation(actor, 'patient', patientId);
      throw new ForbiddenException('You do not have access to this resource');
    }

    // MRs handle doctor acquisition and must never reach clinical data.
    if (actor.principalType === 'MR') {
      await this.recordViolation(actor, 'patient', patientId);
      throw new ForbiddenException('You do not have access to this resource');
    }

    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      select: { id: true },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    if (actor.doctorId) {
      const treating = await this.prisma.doctorPatient.findUnique({
        where: { doctorId_patientId: { doctorId: actor.doctorId, patientId } },
        select: { id: true },
      });
      if (treating) return;
    }

    if (actor.permissions.has(PERMISSIONS.PATIENTS_VIEW) && actor.clinicIds.length > 0) {
      // Staff reach a patient through any appointment at one of their clinics.
      const seenAtClinic = await this.prisma.appointment.findFirst({
        where: { patientId, clinicId: { in: actor.clinicIds } },
        select: { id: true },
      });
      if (seenAtClinic) return;

      // Newly registered patients have no appointment yet; fall back to the org.
      const sameOrg = await this.prisma.patient.findFirst({
        where: { id: patientId, organizationId: actor.organizationId ?? '__none__' },
        select: { id: true },
      });
      if (sameOrg) return;
    }

    await this.recordViolation(actor, 'patient', patientId);
    throw new ForbiddenException('You do not have access to this resource');
  }

  private async recordViolation(
    actor: Actor,
    resourceType: string,
    resourceId: string | null | undefined,
  ): Promise<void> {
    await this.audit.security('TENANT_VIOLATION', {
      userId: actor.userId,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      severity: 'critical',
      metadata: { resourceType, resourceId, principalType: actor.principalType },
    });
  }
}
