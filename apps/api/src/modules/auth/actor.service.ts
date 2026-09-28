import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Permission, SystemRole } from '@cliniqx/shared';
import type { Actor } from '../../common/actor';

@Injectable()
export class ActorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Builds the authorisation context from the database on every request.
   * Permissions are never read from the token, so a revoked role takes effect
   * immediately rather than at the next token refresh.
   */
  async build(
    userId: string,
    sessionId: string,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<Actor | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } },
        doctor: { select: { id: true } },
        staff: { select: { id: true, facilityAccess: { select: { clinicId: true } } } },
        patient: { select: { id: true } },
        mrUser: { select: { id: true } },
        pharmacy: { select: { id: true } },
        lab: { select: { id: true } },
      },
    });

    if (!user || user.status !== 'ACTIVE') return null;

    const permissions = new Set<Permission>();
    const roles: SystemRole[] = [];
    const clinicIds = new Set<string>();

    for (const ur of user.userRoles) {
      roles.push(ur.role.key as SystemRole);
      if (ur.clinicId) clinicIds.add(ur.clinicId);
      for (const rp of ur.role.rolePermissions) permissions.add(rp.permission.key as Permission);
    }
    for (const fa of user.staff?.facilityAccess ?? []) clinicIds.add(fa.clinicId);

    return {
      userId: user.id,
      organizationId: user.organizationId,
      principalType: user.principalType,
      roles,
      permissions,
      clinicIds: [...clinicIds],
      doctorId: user.doctor?.id ?? null,
      staffId: user.staff?.id ?? null,
      patientId: user.patient?.id ?? null,
      mrUserId: user.mrUser?.id ?? null,
      pharmacyIds: user.pharmacy ? [user.pharmacy.id] : [],
      labIds: user.lab ? [user.lab.id] : [],
      sessionId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    };
  }
}
