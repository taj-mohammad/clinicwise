import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Actor } from '../../common/actor';

function startOfDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/**
 * Dashboards for the principals that sit outside a clinic: patients, medical
 * representatives, pharmacy partners and lab partners. Each is scoped to what
 * that principal owns, never to a clinic-wide view.
 */
@Injectable()
export class PartnerDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async patientHome(actor: Actor) {
    if (!actor.patientId) throw new ForbiddenException('This view is only available to patients');
    const patientId = actor.patientId;
    const now = new Date();

    const [patient, nextAppointment, prescriptions, labOrders, documents, unread, invoices] =
      await Promise.all([
        this.prisma.patient.findUniqueOrThrow({
          where: { id: patientId },
          select: {
            id: true, code: true, fullName: true, gender: true, dateOfBirth: true,
            approxAgeYears: true, bloodGroup: true, allergies: true, chronicConditions: true,
          },
        }),
        this.prisma.appointment.findFirst({
          where: {
            patientId,
            scheduledStart: { gte: startOfDay() },
            status: { in: ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION'] },
          },
          orderBy: { scheduledStart: 'asc' },
          select: {
            id: true, code: true, status: true, type: true, scheduledStart: true,
            tokenNumber: true, isPaid: true, fee: true,
            doctor: {
              select: {
                id: true,
                user: { select: { fullName: true } },
                specialties: {
                  where: { isPrimary: true },
                  select: { specialty: { select: { name: true } } },
                },
              },
            },
            practiceLocation: {
              select: {
                id: true,
                location: {
                  select: { id: true, name: true, city: true, clinic: { select: { name: true } } },
                },
              },
            },
          },
        }),
        this.prisma.prescription.count({ where: { patientId, status: 'ISSUED' } }),
        this.prisma.labOrder.count({ where: { patientId } }),
        this.prisma.medicalDocument.count({ where: { patientId, deletedAt: null } }),
        this.prisma.message.count({
          where: {
            conversation: { patientId },
            senderId: { not: actor.userId },
            deletedAt: null,
            receipts: { none: { userId: actor.userId } },
          },
        }),
        this.prisma.invoice.aggregate({
          where: { patientId, status: { in: ['ISSUED', 'PARTIALLY_PAID'] } },
          _sum: { total: true }, _count: { _all: true },
        }),
      ]);

    // Live position in the queue, shown only while the visit is actually running.
    let queue: { currentToken: number | null; myToken: number | null; ahead: number; etaMinutes: number } | null = null;
    if (nextAppointment?.tokenNumber) {
      const entry = await this.prisma.queueEntry.findFirst({
        where: { appointmentId: nextAppointment.id },
        select: {
          tokenNumber: true, position: true,
          queue: {
            select: {
              currentToken: true, avgConsultMin: true,
              entries: { where: { status: 'WAITING' }, select: { position: true } },
            },
          },
        },
      });
      if (entry) {
        const ahead = entry.queue.entries.filter((e) => e.position < entry.position).length;
        queue = {
          currentToken: entry.queue.currentToken,
          myToken: entry.tokenNumber,
          ahead,
          etaMinutes: ahead * entry.queue.avgConsultMin,
        };
      }
    }

    const doctors = await this.prisma.doctorPatient.findMany({
      where: { patientId, isActive: true },
      orderBy: { lastVisitAt: 'desc' },
      take: 5,
      select: {
        lastVisitAt: true, visitCount: true,
        doctor: {
          select: {
            id: true,
            user: { select: { fullName: true } },
            specialties: {
              where: { isPrimary: true },
              select: { specialty: { select: { name: true } } },
            },
          },
        },
      },
    });

    const recentRecords = await this.prisma.consultation.findMany({
      where: { patientId, status: 'COMPLETED' },
      orderBy: { startedAt: 'desc' },
      take: 5,
      select: {
        id: true, code: true, startedAt: true, chiefComplaint: true,
        doctor: { select: { user: { select: { fullName: true } } } },
        diagnoses: { where: { isPrimary: true }, select: { label: true } },
      },
    });

    return {
      patient,
      nextAppointment,
      queue,
      counts: {
        prescriptions,
        labReports: labOrders,
        documents,
        unreadMessages: unread,
        consultations: recentRecords.length,
        outstandingAmount: Number(invoices._sum.total ?? 0),
        outstandingCount: invoices._count._all,
      },
      doctors: doctors.map((d) => ({
        id: d.doctor.id,
        name: d.doctor.user.fullName,
        specialty: d.doctor.specialties[0]?.specialty.name ?? null,
        lastVisitAt: d.lastVisitAt,
        visitCount: d.visitCount,
      })),
      recentRecords,
      generatedAt: now,
    };
  }

  async mrDashboard(actor: Actor) {
    if (!actor.mrUserId) throw new ForbiddenException('This view is only available to representatives');
    const mrUserId = actor.mrUserId;

    const [mr, byStage, visitsThisMonth, dueFollowUps, recentLeads] = await Promise.all([
      this.prisma.mrUser.findUniqueOrThrow({
        where: { id: mrUserId },
        select: { code: true, territory: true, city: true, state: true, monthlyTargetDoctors: true },
      }),
      this.prisma.doctorOnboarding.groupBy({
        by: ['stage'],
        where: { mrUserId },
        _count: { _all: true },
      }),
      this.prisma.mrVisit.count({
        where: {
          mrUserId,
          visitedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      this.prisma.doctorOnboarding.findMany({
        where: { mrUserId, nextActionAt: { lte: endOfDay() }, stage: { notIn: ['ACTIVATED', 'REJECTED', 'INACTIVE'] } },
        orderBy: { nextActionAt: 'asc' },
        take: 10,
        select: { id: true, leadName: true, clinicName: true, city: true, stage: true, nextActionAt: true, leadMobile: true },
      }),
      this.prisma.doctorOnboarding.findMany({
        where: { mrUserId },
        orderBy: { updatedAt: 'desc' },
        take: 12,
        select: {
          id: true, leadName: true, clinicName: true, city: true, stage: true,
          specialtyHint: true, nextActionAt: true, updatedAt: true,
        },
      }),
    ]);

    const stageCounts = Object.fromEntries(byStage.map((s) => [s.stage, s._count._all])) as Record<string, number>;
    const activated = stageCounts.ACTIVATED ?? 0;
    const total = byStage.reduce((sum, s) => sum + s._count._all, 0);

    return {
      profile: mr,
      kpis: {
        totalLeads: total,
        activated,
        inPipeline: total - activated - (stageCounts.REJECTED ?? 0),
        visitsThisMonth,
        dueToday: dueFollowUps.length,
        target: mr.monthlyTargetDoctors,
        // Guarded so a zero target cannot produce a divide-by-zero percentage.
        targetProgress: mr.monthlyTargetDoctors
          ? Math.min(100, Math.round((activated / mr.monthlyTargetDoctors) * 100))
          : 0,
      },
      stageCounts,
      dueFollowUps,
      recentLeads,
    };
  }

  async pharmacyDashboard(actor: Actor) {
    // A desk account is bound to exactly one pharmacy; never fall back to another.
    const account = await this.prisma.user.findUniqueOrThrow({
      where: { id: actor.userId },
      select: { pharmacy: { select: { id: true, name: true } } },
    });
    const pharmacy = account.pharmacy;
    if (!pharmacy) throw new ForbiddenException('No pharmacy is linked to this account');

    const from = startOfDay();
    const to = endOfDay();

    const [byStatus, newToday, lowStock, expiringSoon, recentOrders] = await Promise.all([
      this.prisma.pharmacyOrder.groupBy({
        by: ['status'],
        where: { pharmacyId: pharmacy.id },
        _count: { _all: true },
      }),
      this.prisma.pharmacyOrder.count({
        where: { pharmacyId: pharmacy.id, sentAt: { gte: from, lte: to } },
      }),
      this.prisma.pharmacyInventory.count({
        where: { pharmacyLocation: { pharmacyId: pharmacy.id }, stockQty: { lte: 10 } },
      }),
      this.prisma.pharmacyInventory.count({
        where: {
          pharmacyLocation: { pharmacyId: pharmacy.id },
          expiryDate: { lte: new Date(Date.now() + 90 * 86_400_000) },
        },
      }),
      this.prisma.pharmacyOrder.findMany({
        where: { pharmacyId: pharmacy.id },
        orderBy: { sentAt: 'desc' },
        take: 12,
        select: {
          id: true, code: true, status: true, fulfilmentMode: true, sentAt: true, totalAmount: true,
          patient: { select: { id: true, fullName: true, dateOfBirth: true, approxAgeYears: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);

    const counts = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])) as Record<string, number>;

    return {
      pharmacy: { id: pharmacy.id, name: pharmacy.name },
      kpis: {
        newOrders: (counts.SENT ?? 0) + (counts.ACCEPTED ?? 0),
        preparing: counts.PREPARING ?? 0,
        ready: counts.READY ?? 0,
        outForDelivery: counts.OUT_FOR_DELIVERY ?? 0,
        completed: counts.COMPLETED ?? 0,
        newToday,
        lowStock,
        expiringSoon,
      },
      recentOrders,
    };
  }

  async labDashboard(actor: Actor) {
    const account = await this.prisma.user.findUniqueOrThrow({
      where: { id: actor.userId },
      select: { lab: { select: { id: true, name: true } } },
    });
    const lab = account.lab;
    if (!lab) throw new ForbiddenException('No laboratory is linked to this account');

    const from = startOfDay();
    const to = endOfDay();

    const [byStatus, newToday, homeCollections, recentOrders, testCount] = await Promise.all([
      this.prisma.labOrder.groupBy({
        by: ['status'],
        where: { labId: lab.id },
        _count: { _all: true },
      }),
      this.prisma.labOrder.count({ where: { labId: lab.id, orderedAt: { gte: from, lte: to } } }),
      this.prisma.labOrder.count({
        where: { labId: lab.id, homeCollection: true, status: { in: ['ORDERED', 'ACCEPTED'] } },
      }),
      this.prisma.labOrder.findMany({
        where: { labId: lab.id },
        orderBy: { orderedAt: 'desc' },
        take: 12,
        select: {
          id: true, code: true, status: true, homeCollection: true, orderedAt: true,
          patient: { select: { id: true, fullName: true, dateOfBirth: true, approxAgeYears: true } },
          doctor: { select: { user: { select: { fullName: true } } } },
          items: { select: { testName: true } },
        },
      }),
      this.prisma.labTest.count({ where: { labId: lab.id, isActive: true } }),
    ]);

    const counts = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])) as Record<string, number>;

    return {
      lab: { id: lab.id, name: lab.name },
      kpis: {
        newOrders: (counts.ORDERED ?? 0) + (counts.ACCEPTED ?? 0),
        collection: counts.SAMPLE_COLLECTED ?? 0,
        processing: counts.PROCESSING ?? 0,
        reportsReady: counts.REPORT_READY ?? 0,
        delivered: counts.DELIVERED ?? 0,
        newToday,
        homeCollections,
        testsOffered: testCount,
      },
      recentOrders,
    };
  }
}
