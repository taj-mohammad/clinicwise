import { PERMISSIONS, type Permission } from '@cliniqx/shared';
import type { Actor } from '../../common/actor';

export type ScopeKind =
  | 'clinic'        // rows carry clinicId — restrict to the actor's clinics
  | 'doctor'        // rows carry doctorId — a doctor sees only their own
  | 'patient'       // rows carry patientId — a patient sees only their own
  | 'pharmacy'      // rows carry pharmacyId — bound to the desk account
  | 'lab'           // rows carry labId — bound to the desk account
  | 'mr'            // rows carry mrUserId
  | 'staffSelf'     // staff see their own HR rows unless they can manage
  | 'platform'      // platform-wide, gated purely by permission
  | 'none';

export interface ResourceDefinition {
  /** Prisma delegate name, e.g. `patient`. */
  model: string;
  permission: Permission;
  scope: ScopeKind;
  /** Columns matched by the `q` parameter, case-insensitively. */
  searchFields?: string[];
  select: Record<string, unknown>;
  orderBy: Record<string, 'asc' | 'desc'>;
  /** Extra filters accepted from the query string, mapped to Prisma fragments. */
  filters?: Record<string, (value: string) => Record<string, unknown>>;
  /** Always-on constraint, e.g. excluding soft-deleted rows. */
  baseWhere?: Record<string, unknown>;
  /** Permission that lifts a self-scope to the whole clinic. */
  managePermission?: Permission;
  /**
   * Overrides the generic scope filter when a model reaches its owner through
   * a relation rather than a direct column.
   */
  scopeWhere?: (actor: Actor) => Record<string, unknown>;
}

const NO_MATCH = '00000000-0000-0000-0000-000000000000';

const patientSelect = {
  id: true, code: true, fullName: true, mobile: true, gender: true,
  dateOfBirth: true, approxAgeYears: true, bloodGroup: true, city: true,
  allergies: true, chronicConditions: true, createdAt: true,
};

const personName = { user: { select: { fullName: true, email: true, mobile: true, avatarKey: true } } };

export const RESOURCES: Record<string, ResourceDefinition> = {
  patients: {
    model: 'patient',
    permission: PERMISSIONS.PATIENTS_VIEW,
    scope: 'patient',
    searchFields: ['fullName', 'mobile', 'code'],
    baseWhere: { deletedAt: null },
    select: patientSelect,
    orderBy: { createdAt: 'desc' },
    filters: { gender: (v) => ({ gender: v }), city: (v) => ({ city: v }) },
  },

  doctors: {
    model: 'doctor',
    permission: PERMISSIONS.DOCTORS_VIEW,
    scope: 'platform',
    baseWhere: { deletedAt: null },
    select: {
      id: true, code: true, qualification: true, experienceYears: true,
      registrationNo: true, status: true, isOnline: true,
      ...personName,
      specialties: { select: { isPrimary: true, specialty: { select: { name: true } } } },
      practiceLocations: {
        where: { status: 'ACTIVE' },
        select: {
          consultationFee: true,
          location: { select: { id: true, name: true, city: true, clinic: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    filters: { status: (v) => ({ status: v }) },
  },

  staff: {
    model: 'staff',
    permission: PERMISSIONS.STAFF_VIEW,
    scope: 'staffSelf',
    managePermission: PERMISSIONS.STAFF_MANAGE,
    baseWhere: { deletedAt: null },
    select: {
      id: true, code: true, designation: true, department: true,
      joiningDate: true, status: true, salaryType: true,
      ...personName,
      facilityAccess: { select: { clinicId: true, isPrimary: true } },
    },
    orderBy: { createdAt: 'asc' },
    filters: { status: (v) => ({ status: v }), department: (v) => ({ department: v }) },
  },

  appointments: {
    model: 'appointment',
    permission: PERMISSIONS.APPOINTMENTS_VIEW,
    scope: 'clinic',
    select: {
      id: true, code: true, type: true, status: true, tokenNumber: true,
      scheduledStart: true, scheduledEnd: true, reason: true, fee: true, isPaid: true,
      patient: { select: { id: true, code: true, fullName: true, mobile: true, gender: true, dateOfBirth: true, approxAgeYears: true } },
      doctor: { select: { id: true, user: { select: { fullName: true } } } },
      practiceLocation: { select: { location: { select: { id: true, name: true, city: true } } } },
    },
    orderBy: { scheduledStart: 'desc' },
    filters: {
      status: (v) => ({ status: v }),
      type: (v) => ({ type: v }),
      doctorId: (v) => ({ doctorId: v }),
    },
  },

  consultations: {
    model: 'consultation',
    permission: PERMISSIONS.CONSULTATION_VIEW,
    scope: 'clinic',
    select: {
      id: true, code: true, status: true, chiefComplaint: true,
      startedAt: true, completedAt: true, followUpDate: true, version: true,
      patient: { select: { id: true, code: true, fullName: true, gender: true, dateOfBirth: true, approxAgeYears: true } },
      doctor: { select: { id: true, user: { select: { fullName: true } } } },
      diagnoses: { where: { isPrimary: true }, select: { label: true, code: true } },
    },
    orderBy: { startedAt: 'desc' },
    filters: { status: (v) => ({ status: v }) },
  },

  prescriptions: {
    model: 'prescription',
    permission: PERMISSIONS.PRESCRIPTION_VIEW,
    scope: 'clinic',
    select: {
      id: true, code: true, source: true, status: true, diagnosisText: true,
      issuedAt: true, createdAt: true, verificationCode: true,
      patient: { select: { id: true, code: true, fullName: true } },
      doctor: { select: { id: true, user: { select: { fullName: true } } } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
    filters: { status: (v) => ({ status: v }), source: (v) => ({ source: v }) },
  },

  'lab-orders': {
    model: 'labOrder',
    permission: PERMISSIONS.LAB_REPORT_VIEW,
    scope: 'clinic',
    select: {
      id: true, code: true, status: true, homeCollection: true,
      orderedAt: true, reportReadyAt: true, totalAmount: true,
      patient: { select: { id: true, code: true, fullName: true } },
      doctor: { select: { id: true, user: { select: { fullName: true } } } },
      lab: { select: { id: true, name: true } },
      items: { select: { testName: true, price: true } },
    },
    orderBy: { orderedAt: 'desc' },
    filters: { status: (v) => ({ status: v }) },
  },

  payments: {
    model: 'payment',
    permission: PERMISSIONS.PAYMENT_VIEW,
    scope: 'clinic',
    select: {
      id: true, code: true, method: true, status: true, amount: true,
      currency: true, capturedAt: true, createdAt: true, provider: true,
      patient: { select: { id: true, code: true, fullName: true } },
      invoice: { select: { id: true, number: true } },
    },
    orderBy: { createdAt: 'desc' },
    filters: { status: (v) => ({ status: v }), method: (v) => ({ method: v }) },
  },

  invoices: {
    model: 'invoice',
    permission: PERMISSIONS.INVOICE_VIEW,
    scope: 'clinic',
    select: {
      id: true, number: true, status: true, subtotal: true, discount: true,
      taxAmount: true, total: true, amountPaid: true, issuedAt: true, createdAt: true,
      patient: { select: { id: true, code: true, fullName: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
    filters: { status: (v) => ({ status: v }) },
  },

  expenses: {
    model: 'expense',
    permission: PERMISSIONS.EXPENSE_MANAGE,
    scope: 'clinic',
    select: {
      id: true, date: true, amount: true, vendor: true, description: true, status: true,
      category: { select: { id: true, name: true, key: true } },
    },
    orderBy: { date: 'desc' },
    filters: { status: (v) => ({ status: v }) },
  },

  attendance: {
    model: 'attendance',
    permission: PERMISSIONS.ATTENDANCE_VIEW,
    scope: 'clinic',
    select: {
      id: true, date: true, checkInAt: true, checkOutAt: true,
      workedMinutes: true, status: true, method: true,
      staff: { select: { id: true, code: true, designation: true, ...personName } },
    },
    orderBy: { date: 'desc' },
    filters: { status: (v) => ({ status: v }) },
  },

  'leave-requests': {
    model: 'leaveRequest',
    permission: PERMISSIONS.LEAVE_VIEW,
    scope: 'staffSelf',
    managePermission: PERMISSIONS.LEAVE_APPROVE,
    select: {
      id: true, type: true, startDate: true, endDate: true, days: true,
      reason: true, status: true, createdAt: true,
      staff: { select: { id: true, code: true, designation: true, ...personName } },
    },
    orderBy: { createdAt: 'desc' },
    filters: { status: (v) => ({ status: v }) },
  },

  payroll: {
    model: 'payroll',
    permission: PERMISSIONS.PAYROLL_VIEW,
    scope: 'clinic',
    select: {
      id: true, periodYear: true, periodMonth: true, status: true,
      grossTotal: true, netTotal: true, paidAt: true, approvedAt: true,
      _count: { select: { items: true } },
    },
    orderBy: { periodYear: 'desc' },
    filters: { status: (v) => ({ status: v }) },
  },

  payslips: {
    model: 'payslip',
    permission: PERMISSIONS.PAYROLL_VIEW,
    scope: 'staffSelf',
    managePermission: PERMISSIONS.PAYROLL_MANAGE,
    select: {
      id: true, number: true, issuedAt: true, snapshot: true,
      staff: { select: { id: true, code: true, ...personName } },
      payroll: { select: { periodYear: true, periodMonth: true, status: true } },
    },
    orderBy: { issuedAt: 'desc' },
  },

  documents: {
    model: 'medicalDocument',
    permission: PERMISSIONS.DOCUMENTS_VIEW,
    scope: 'clinic',
    baseWhere: { deletedAt: null },
    select: {
      id: true, kind: true, origin: true, title: true, mimeType: true,
      sizeBytes: true, uploadedAt: true, originalFilename: true,
      patient: { select: { id: true, code: true, fullName: true } },
    },
    orderBy: { uploadedAt: 'desc' },
    filters: { kind: (v) => ({ kind: v }) },
  },

  organizations: {
    model: 'organization',
    permission: PERMISSIONS.ORG_VIEW,
    scope: 'platform',
    baseWhere: { deletedAt: null },
    searchFields: ['name', 'code', 'city'],
    select: {
      id: true, code: true, name: true, legalName: true, email: true, phone: true,
      city: true, state: true, status: true, createdAt: true,
      _count: { select: { clinics: true, users: true } },
    },
    orderBy: { createdAt: 'desc' },
    filters: { status: (v) => ({ status: v }) },
  },

  clinics: {
    model: 'clinic',
    permission: PERMISSIONS.CLINIC_VIEW,
    scope: 'platform',
    baseWhere: { deletedAt: null },
    searchFields: ['name', 'code'],
    select: {
      id: true, code: true, name: true, email: true, phone: true,
      registrationNo: true, status: true, createdAt: true,
      organization: { select: { id: true, name: true } },
      locations: { select: { id: true, name: true, city: true, state: true } },
    },
    orderBy: { createdAt: 'asc' },
    filters: { status: (v) => ({ status: v }) },
  },

  pharmacies: {
    model: 'pharmacy',
    permission: PERMISSIONS.PHARMACY_ORDER_VIEW,
    scope: 'platform',
    baseWhere: { deletedAt: null },
    searchFields: ['name', 'code'],
    select: {
      id: true, code: true, name: true, licenseNo: true, email: true,
      phone: true, status: true, createdAt: true,
      locations: { select: { id: true, name: true, city: true, delivers: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'asc' },
  },

  labs: {
    model: 'lab',
    permission: PERMISSIONS.LAB_REPORT_VIEW,
    scope: 'platform',
    baseWhere: { deletedAt: null },
    searchFields: ['name', 'code'],
    select: {
      id: true, code: true, name: true, registrationNo: true, email: true,
      phone: true, status: true, createdAt: true,
      locations: { select: { id: true, name: true, city: true, homeCollection: true } },
      _count: { select: { orders: true, tests: true } },
    },
    orderBy: { createdAt: 'asc' },
  },

  'mr-leads': {
    model: 'doctorOnboarding',
    permission: PERMISSIONS.MR_LEADS_MANAGE,
    scope: 'mr',
    searchFields: ['leadName', 'leadMobile', 'clinicName'],
    select: {
      id: true, leadName: true, leadMobile: true, leadEmail: true, clinicName: true,
      city: true, specialtyHint: true, stage: true, nextActionAt: true,
      notes: true, createdAt: true, updatedAt: true,
      mrUser: { select: { id: true, code: true, ...personName } },
    },
    orderBy: { updatedAt: 'desc' },
    filters: { stage: (v) => ({ stage: v }) },
  },

  'mr-visits': {
    model: 'mrVisit',
    permission: PERMISSIONS.MR_LEADS_MANAGE,
    scope: 'mr',
    select: {
      id: true, type: true, visitedAt: true, outcome: true, notes: true,
      onboarding: { select: { id: true, leadName: true, clinicName: true, stage: true } },
    },
    orderBy: { visitedAt: 'desc' },
    filters: { type: (v) => ({ type: v }) },
  },

  'pharmacy-orders': {
    model: 'pharmacyOrder',
    permission: PERMISSIONS.PHARMACY_ORDER_VIEW,
    scope: 'pharmacy',
    select: {
      id: true, code: true, status: true, fulfilmentMode: true, totalAmount: true,
      sentAt: true, acceptedAt: true, readyAt: true, notes: true,
      patient: { select: { id: true, code: true, fullName: true, dateOfBirth: true, approxAgeYears: true } },
      prescription: { select: { id: true, code: true } },
      items: { select: { id: true, medicineName: true, requestedQty: true, availableQty: true, unitPrice: true, isAvailable: true } },
    },
    orderBy: { sentAt: 'desc' },
    filters: { status: (v) => ({ status: v }) },
  },

  'pharmacy-inventory': {
    model: 'pharmacyInventory',
    permission: PERMISSIONS.PHARMACY_INVENTORY_MANAGE,
    scope: 'pharmacy',
    scopeWhere: (actor) => ({
      pharmacyLocation: { pharmacyId: actor.pharmacyIds?.[0] ?? NO_MATCH },
    }),
    searchFields: ['medicineName', 'genericName', 'brand'],
    select: {
      id: true, medicineName: true, genericName: true, brand: true, strength: true,
      packSize: true, mrp: true, sellingPrice: true, stockQty: true,
      batchNo: true, expiryDate: true, isAvailable: true,
    },
    orderBy: { medicineName: 'asc' },
  },

  'lab-tests': {
    model: 'labTest',
    permission: PERMISSIONS.LAB_REPORT_VIEW,
    scope: 'lab',
    searchFields: ['name', 'code', 'category'],
    select: {
      id: true, code: true, name: true, category: true, sampleType: true,
      preparationNote: true, turnaroundHours: true, isActive: true,
      prices: { select: { price: true, homeCollectionFee: true } },
    },
    orderBy: { name: 'asc' },
  },

  'audit-logs': {
    model: 'auditLog',
    permission: PERMISSIONS.AUDIT_VIEW,
    scope: 'platform',
    select: {
      id: true, action: true, resourceType: true, resourceId: true,
      patientId: true, ipAddress: true, userAgent: true, createdAt: true, metadata: true,
      user: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    filters: { action: (v) => ({ action: v }), resourceType: (v) => ({ resourceType: v }) },
  },

  'security-events': {
    model: 'securityEvent',
    permission: PERMISSIONS.SECURITY_MANAGE,
    scope: 'platform',
    select: {
      id: true, type: true, severity: true, email: true, mobile: true,
      ipAddress: true, userAgent: true, metadata: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    filters: { type: (v) => ({ type: v }), severity: (v) => ({ severity: v }) },
  },

  notifications: {
    model: 'notification',
    permission: PERMISSIONS.MESSAGES_VIEW,
    scope: 'none',
    select: {
      id: true, type: true, title: true, body: true, deepLink: true,
      readAt: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  },

  'diet-plans': {
    model: 'dietPlan',
    permission: PERMISSIONS.DIET_MANAGE,
    scope: 'doctor',
    select: {
      id: true, title: true, status: true, version: true,
      startDate: true, endDate: true, createdAt: true,
      patient: { select: { id: true, code: true, fullName: true } },
      doctor: { select: { id: true, user: { select: { fullName: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    filters: { status: (v) => ({ status: v }) },
  },

  blogs: {
    model: 'blog',
    permission: PERMISSIONS.BLOG_MANAGE,
    scope: 'doctor',
    searchFields: ['title', 'slug'],
    select: {
      id: true, slug: true, title: true, excerpt: true, status: true,
      tags: true, publishedAt: true, viewCount: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    filters: { status: (v) => ({ status: v }) },
  },

  reviews: {
    model: 'review',
    permission: PERMISSIONS.REVIEW_MODERATE,
    scope: 'platform',
    select: {
      id: true, rating: true, comment: true, status: true, createdAt: true,
      patient: { select: { id: true, fullName: true } },
      doctor: { select: { id: true, user: { select: { fullName: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    filters: { status: (v) => ({ status: v }) },
  },

  specialties: {
    model: 'specialty',
    permission: PERMISSIONS.DOCTORS_VIEW,
    scope: 'platform',
    select: { id: true, key: true, name: true, description: true, _count: { select: { doctorSpecialties: true } } },
    orderBy: { name: 'asc' },
  },

  medicines: {
    model: 'medicine',
    permission: PERMISSIONS.PRESCRIPTION_VIEW,
    scope: 'platform',
    searchFields: ['name', 'genericName'],
    select: { id: true, name: true, genericName: true, strength: true, form: true, manufacturer: true, isActive: true },
    orderBy: { name: 'asc' },
  },

  'advice-templates': {
    model: 'quickAdviceTemplate',
    permission: PERMISSIONS.ADVICE_SEND,
    scope: 'platform',
    searchFields: ['title', 'category'],
    select: { id: true, category: true, title: true, bodyEn: true, bodyHi: true, isSystem: true, isActive: true },
    orderBy: { category: 'asc' },
  },
};

export function resourceNames(): string[] {
  return Object.keys(RESOURCES);
}

/** Builds the tenant/ownership filter for a resource, given who is asking. */
export function scopeWhere(def: ResourceDefinition, actor: Actor): Record<string, unknown> {
  const platformWide = actor.principalType === 'PLATFORM';
  if (def.scopeWhere) return def.scopeWhere(actor);

  switch (def.scope) {
    case 'platform':
      return {};

    case 'clinic': {
      if (platformWide) return {};
      return { clinicId: { in: actor.clinicIds.length ? actor.clinicIds : [NO_MATCH] } };
    }

    case 'doctor': {
      if (platformWide) return {};
      if (actor.doctorId) return { doctorId: actor.doctorId };
      return { clinicId: { in: actor.clinicIds } };
    }

    case 'patient': {
      // Patients are restricted to themselves; staff fall back to clinic reach.
      if (actor.principalType === 'PATIENT') {
        return { id: actor.patientId ?? NO_MATCH };
      }
      if (platformWide) return {};
      if (actor.doctorId) return { doctors: { some: { doctorId: actor.doctorId } } };
      return { organizationId: actor.organizationId };
    }

    case 'pharmacy':
      return { pharmacyId: actor.pharmacyIds?.[0] ?? NO_MATCH };

    case 'lab':
      return { labId: actor.labIds?.[0] ?? NO_MATCH };

    case 'mr': {
      if (platformWide) return {};
      return { mrUserId: actor.mrUserId ?? NO_MATCH };
    }

    case 'staffSelf': {
      if (platformWide) return {};
      const canManage = def.managePermission ? actor.permissions.has(def.managePermission) : false;
      if (canManage) return {};
      return { staffId: actor.staffId ?? NO_MATCH };
    }

    case 'none':
      return { userId: actor.userId };

    default:
      return {};
  }
}
