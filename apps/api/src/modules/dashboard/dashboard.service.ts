import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../../common/services/access.service';
import type { Actor } from '../../common/actor';

function startOfDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  /** Everything the doctor dashboard renders, in one round trip. */
  async doctorDashboard(actor: Actor, locationId?: string) {
    if (!actor.doctorId) throw new ForbiddenException('This view is only available to doctors');
    const doctorId = actor.doctorId;

    const practiceLocations = await this.prisma.doctorPracticeLocation.findMany({
      where: { doctorId, deletedAt: null, status: 'ACTIVE' },
      select: {
        id: true, consultationFee: true, slotDurationMin: true,
        location: {
          select: {
            id: true, name: true, city: true,
            clinic: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // An unknown or unowned location id must not silently widen the scope.
    const selected = locationId
      ? practiceLocations.filter((pl) => pl.location.id === locationId)
      : practiceLocations;
    if (locationId && selected.length === 0) {
      throw new ForbiddenException('You do not practise at this location');
    }
    const practiceIds = selected.map((pl) => pl.id);

    const from = startOfDay();
    const to = endOfDay();

    const [
      todaysAppointments, waiting, completedToday, followUpsToday,
      reportsReady, unreadMessages, queues, weekCount, monthCount,
    ] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          doctorId,
          practiceLocationId: { in: practiceIds },
          scheduledStart: { gte: from, lte: to },
          status: { notIn: ['CANCELLED'] },
        },
        orderBy: { scheduledStart: 'asc' },
        select: {
          id: true, code: true, type: true, status: true, tokenNumber: true,
          scheduledStart: true, reason: true, isPaid: true,
          patient: {
            select: { id: true, fullName: true, gender: true, dateOfBirth: true, approxAgeYears: true, code: true },
          },
          practiceLocation: { select: { location: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.appointment.count({
        where: {
          doctorId, practiceLocationId: { in: practiceIds },
          scheduledStart: { gte: from, lte: to }, status: 'WAITING',
        },
      }),
      this.prisma.appointment.count({
        where: {
          doctorId, practiceLocationId: { in: practiceIds },
          scheduledStart: { gte: from, lte: to }, status: 'COMPLETED',
        },
      }),
      this.prisma.appointment.count({
        where: {
          doctorId, practiceLocationId: { in: practiceIds },
          scheduledStart: { gte: from, lte: to }, type: 'FOLLOW_UP',
        },
      }),
      this.prisma.labOrder.count({
        where: { doctorId, status: { in: ['REPORT_READY'] } },
      }),
      this.prisma.message.count({
        where: {
          conversation: { doctorId },
          deletedAt: null,
          receipts: { none: { userId: actor.userId } },
          senderId: { not: actor.userId },
        },
      }),
      this.prisma.queue.findMany({
        where: { practiceLocationId: { in: practiceIds }, date: from },
        select: {
          id: true, currentToken: true, avgConsultMin: true,
          entries: {
            where: { status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] } },
            orderBy: { position: 'asc' },
            select: {
              id: true, tokenNumber: true, status: true, position: true, joinedAt: true,
              patient: {
                select: { id: true, fullName: true, gender: true, dateOfBirth: true, approxAgeYears: true },
              },
            },
          },
        },
      }),
      this.prisma.consultation.count({
        where: { doctorId, startedAt: { gte: addDays(from, -7) } },
      }),
      this.prisma.consultation.count({
        where: { doctorId, startedAt: { gte: new Date(from.getFullYear(), from.getMonth(), 1) } },
      }),
    ]);

    const queue = queues[0];
    const inConsultation = queue?.entries.find((e) => e.status === 'IN_CONSULTATION') ?? null;
    const upcoming = queue?.entries.filter((e) => e.status === 'WAITING') ?? [];

    return {
      locations: practiceLocations.map((pl) => ({
        id: pl.location.id,
        name: pl.location.name,
        city: pl.location.city,
        clinicId: pl.location.clinic.id,
        clinicName: pl.location.clinic.name,
        consultationFee: Number(pl.consultationFee),
      })),
      selectedLocationId: locationId ?? null,
      kpis: {
        appointmentsToday: todaysAppointments.length,
        waiting,
        completedToday,
        followUpsToday,
        reportsReady,
        unreadMessages,
        consultationsThisWeek: weekCount,
        consultationsThisMonth: monthCount,
      },
      appointments: todaysAppointments,
      queue: {
        currentToken: queue?.currentToken ?? null,
        avgConsultMin: queue?.avgConsultMin ?? 15,
        nowConsulting: inConsultation,
        waiting: upcoming,
        waitingCount: upcoming.length,
      },
    };
  }

  /** Clinic-wide operational snapshot for admin, reception and management. */
  async clinicDashboard(actor: Actor, clinicId?: string) {
    const scopedClinics = clinicId
      ? [clinicId]
      : actor.clinicIds;
    if (clinicId) await this.access.assertClinic(actor, clinicId);
    if (scopedClinics.length === 0) {
      throw new ForbiddenException('You are not assigned to a clinic');
    }

    const from = startOfDay();
    const to = endOfDay();
    const clinicFilter = { clinicId: { in: scopedClinics } };

    const [
      appointments, walkIns, waiting, completed, noShows,
      doctorsOnDuty, attendance, payments, pendingInvoices, labOrders, reportsReady,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: { ...clinicFilter, scheduledStart: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
      }),
      this.prisma.appointment.count({
        where: { ...clinicFilter, scheduledStart: { gte: from, lte: to }, type: 'WALK_IN' },
      }),
      this.prisma.appointment.count({
        where: { ...clinicFilter, scheduledStart: { gte: from, lte: to }, status: 'WAITING' },
      }),
      this.prisma.appointment.count({
        where: { ...clinicFilter, scheduledStart: { gte: from, lte: to }, status: 'COMPLETED' },
      }),
      this.prisma.appointment.count({
        where: { ...clinicFilter, scheduledStart: { gte: from, lte: to }, status: 'NO_SHOW' },
      }),
      this.prisma.appointment.findMany({
        where: { ...clinicFilter, scheduledStart: { gte: from, lte: to } },
        distinct: ['doctorId'],
        select: {
          doctorId: true,
          doctor: { select: { id: true, isOnline: true, user: { select: { fullName: true } } } },
        },
      }),
      this.prisma.attendance.groupBy({
        by: ['status'],
        where: { clinicId: { in: scopedClinics }, date: from },
        _count: { _all: true },
      }),
      this.prisma.payment.aggregate({
        where: { clinicId: { in: scopedClinics }, status: 'SUCCESS', createdAt: { gte: from, lte: to } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.invoice.aggregate({
        where: { clinicId: { in: scopedClinics }, status: { in: ['ISSUED', 'PARTIALLY_PAID'] } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.labOrder.count({
        where: { clinicId: { in: scopedClinics }, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
      }),
      this.prisma.labOrder.count({
        where: { clinicId: { in: scopedClinics }, status: 'REPORT_READY' },
      }),
    ]);

    const todaysList = await this.prisma.appointment.findMany({
      where: { ...clinicFilter, scheduledStart: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
      orderBy: { scheduledStart: 'asc' },
      take: 25,
      select: {
        id: true, code: true, status: true, type: true, tokenNumber: true, scheduledStart: true,
        patient: { select: { id: true, fullName: true, dateOfBirth: true, approxAgeYears: true, gender: true } },
        doctor: { select: { id: true, user: { select: { fullName: true } } } },
      },
    });

    const attendanceMap = Object.fromEntries(
      attendance.map((a) => [a.status, a._count._all]),
    ) as Record<string, number>;

    return {
      kpis: {
        appointmentsToday: appointments,
        walkIns,
        waiting,
        completed,
        noShows,
        doctorsOnDuty: doctorsOnDuty.length,
        staffPresent: (attendanceMap.PRESENT ?? 0) + (attendanceMap.LATE ?? 0),
        staffLate: attendanceMap.LATE ?? 0,
        staffAbsent: attendanceMap.ABSENT ?? 0,
        collectedToday: Number(payments._sum.amount ?? 0),
        paymentCount: payments._count._all,
        outstanding: Number(pendingInvoices._sum.total ?? 0),
        outstandingCount: pendingInvoices._count._all,
        labOrders,
        reportsReady,
      },
      appointments: todaysList,
      doctors: doctorsOnDuty.map((d) => ({
        id: d.doctor.id,
        name: d.doctor.user.fullName,
        isOnline: d.doctor.isOnline,
      })),
    };
  }

  /** Platform-wide counts and health for the super admin. */
  async platformDashboard() {
    const from = startOfDay();
    const to = endOfDay();

    const [
      organizations, clinics, doctors, patients, staff, pharmacies, labs,
      appointmentsToday, consultationsToday, pendingDoctors, revenue,
    ] = await Promise.all([
      this.prisma.organization.count({ where: { deletedAt: null } }),
      this.prisma.clinic.count({ where: { deletedAt: null } }),
      this.prisma.doctor.count({ where: { deletedAt: null } }),
      this.prisma.patient.count({ where: { deletedAt: null } }),
      this.prisma.staff.count({ where: { deletedAt: null } }),
      this.prisma.pharmacy.count({ where: { deletedAt: null } }),
      this.prisma.lab.count({ where: { deletedAt: null } }),
      this.prisma.appointment.count({ where: { scheduledStart: { gte: from, lte: to } } }),
      this.prisma.consultation.count({ where: { startedAt: { gte: from, lte: to } } }),
      this.prisma.doctor.count({ where: { status: 'PENDING_VERIFICATION' } }),
      this.prisma.payment.aggregate({
        where: { status: 'SUCCESS', createdAt: { gte: addDays(from, -30) } },
        _sum: { amount: true },
      }),
    ]);

    // Daily appointment counts for the trend chart.
    const trend = await this.prisma.$queryRaw<{ day: Date; appointments: bigint; consultations: bigint }[]>`
      SELECT d::date AS day,
             (SELECT count(*) FROM appointments a WHERE a."scheduledStart"::date = d::date) AS appointments,
             (SELECT count(*) FROM consultations c WHERE c."startedAt"::date = d::date) AS consultations
      FROM generate_series(current_date - interval '29 days', current_date, interval '1 day') d
      ORDER BY day
    `;

    const topCities = await this.prisma.$queryRaw<{ city: string; count: bigint }[]>`
      SELECT COALESCE(city, 'Unknown') AS city, count(*) AS count
      FROM patients WHERE "deletedAt" IS NULL
      GROUP BY city ORDER BY count DESC LIMIT 6
    `;

    return {
      kpis: {
        organizations, clinics, doctors, patients, staff, pharmacies, labs,
        appointmentsToday, consultationsToday,
        revenue30d: Number(revenue._sum.amount ?? 0),
      },
      operations: { pendingDoctorVerifications: pendingDoctors },
      trend: trend.map((t) => ({
        day: t.day,
        appointments: Number(t.appointments),
        consultations: Number(t.consultations),
      })),
      topCities: topCities.map((c) => ({ city: c.city, count: Number(c.count) })),
    };
  }
}
