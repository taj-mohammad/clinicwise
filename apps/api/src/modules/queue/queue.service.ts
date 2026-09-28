import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Actor } from '../../common/actor';

function today(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

@Injectable()
export class QueueService {
  constructor(private readonly prisma: PrismaService) {}

  /** Today's queues, scoped to the doctor or to the caller's clinics. */
  async todaysQueues(actor: Actor) {
    const where = actor.doctorId
      ? { practiceLocation: { doctorId: actor.doctorId } }
      : actor.principalType === 'PLATFORM'
        ? {}
        : { practiceLocation: { location: { clinicId: { in: actor.clinicIds } } } };

    const queues = await this.prisma.queue.findMany({
      where: { date: today(), ...where },
      select: {
        id: true, status: true, currentToken: true, lastIssuedToken: true, avgConsultMin: true,
        practiceLocation: {
          select: {
            id: true,
            doctor: { select: { id: true, user: { select: { fullName: true } } } },
            location: { select: { id: true, name: true, city: true, clinic: { select: { name: true } } } },
          },
        },
        entries: {
          orderBy: [{ status: 'asc' }, { position: 'asc' }],
          select: {
            id: true, tokenNumber: true, position: true, status: true,
            joinedAt: true, calledAt: true, completedAt: true,
            patient: {
              select: {
                id: true, code: true, fullName: true, gender: true,
                dateOfBirth: true, approxAgeYears: true, mobile: true,
              },
            },
            appointment: { select: { id: true, type: true, reason: true, isPaid: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      date: today(),
      queues: queues.map((q) => ({
        ...q,
        waiting: q.entries.filter((e) => e.status === 'WAITING').length,
        completed: q.entries.filter((e) => e.status === 'COMPLETED').length,
      })),
    };
  }

  /** Role and permission matrix, for the governance screen. */
  async roleMatrix(actor: Actor) {
    if (actor.principalType !== 'PLATFORM' && !actor.permissions.has('security.manage' as never)) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    const [roles, permissions] = await Promise.all([
      this.prisma.role.findMany({
        select: {
          id: true, key: true, name: true, description: true, isSystem: true,
          rolePermissions: { select: { permission: { select: { key: true } } } },
          _count: { select: { userRoles: true } },
        },
        orderBy: { key: 'asc' },
      }),
      this.prisma.permission.findMany({
        select: { key: true, resource: true, action: true },
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      }),
    ]);

    return {
      roles: roles.map((r) => ({
        id: r.id, key: r.key, name: r.name, isSystem: r.isSystem,
        userCount: r._count.userRoles,
        permissions: r.rolePermissions.map((rp) => rp.permission.key),
      })),
      permissions,
    };
  }
}
