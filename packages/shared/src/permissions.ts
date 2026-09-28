/**
 * CliniqX permission catalogue.
 *
 * Every permission is `<resource>.<action>` and is the ONLY thing the API
 * authorises against. Frontend menu visibility is presentation, never security.
 */
export const PERMISSIONS = {
  // Tenancy
  ORG_VIEW: 'org.view',
  ORG_MANAGE: 'org.manage',
  CLINIC_VIEW: 'clinic.view',
  CLINIC_MANAGE: 'clinic.manage',
  LOCATION_MANAGE: 'location.manage',

  // People
  PATIENTS_VIEW: 'patients.view',
  PATIENTS_CREATE: 'patients.create',
  PATIENTS_EDIT: 'patients.edit',
  PATIENTS_MEDICAL_VIEW: 'patients.medical.view',
  DOCTORS_VIEW: 'doctors.view',
  DOCTORS_MANAGE: 'doctors.manage',
  STAFF_VIEW: 'staff.view',
  STAFF_MANAGE: 'staff.manage',

  // Scheduling
  APPOINTMENTS_VIEW: 'appointments.view',
  APPOINTMENTS_CREATE: 'appointments.create',
  APPOINTMENTS_EDIT: 'appointments.edit',
  APPOINTMENTS_CANCEL: 'appointments.cancel',
  SCHEDULE_MANAGE: 'schedule.manage',
  QUEUE_VIEW: 'queue.view',
  QUEUE_MANAGE: 'queue.manage',

  // Clinical
  CONSULTATION_VIEW: 'consultation.view',
  CONSULTATION_CREATE: 'consultation.create',
  CONSULTATION_COMPLETE: 'consultation.complete',
  PRESCRIPTION_VIEW: 'prescription.view',
  PRESCRIPTION_CREATE: 'prescription.create',
  PRESCRIPTION_SHARE: 'prescription.share',
  ADVICE_SEND: 'advice.send',
  DIET_MANAGE: 'diet.manage',
  DIET_APPROVE: 'diet.approve',

  // Diagnostics & pharmacy
  LAB_ORDER: 'lab.order',
  LAB_REPORT_VIEW: 'lab.report.view',
  LAB_REPORT_UPLOAD: 'lab.report.upload',
  PHARMACY_ORDER_VIEW: 'pharmacy.order.view',
  PHARMACY_ORDER_MANAGE: 'pharmacy.order.manage',
  PHARMACY_INVENTORY_MANAGE: 'pharmacy.inventory.manage',

  // Documents
  DOCUMENTS_VIEW: 'documents.view',
  DOCUMENTS_UPLOAD: 'documents.upload',
  DOCUMENTS_DELETE: 'documents.delete',

  // Money
  PAYMENT_VIEW: 'payment.view',
  PAYMENT_CREATE: 'payment.create',
  PAYMENT_REFUND: 'payment.refund',
  INVOICE_VIEW: 'invoice.view',
  INVOICE_CREATE: 'invoice.create',
  EXPENSE_MANAGE: 'expense.manage',
  EXPENSE_APPROVE: 'expense.approve',

  // HR
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_MANAGE: 'attendance.manage',
  LEAVE_VIEW: 'leave.view',
  LEAVE_APPROVE: 'leave.approve',
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_MANAGE: 'payroll.manage',
  PAYROLL_APPROVE: 'payroll.approve',

  // Comms
  MESSAGES_VIEW: 'messages.view',
  MESSAGES_SEND: 'messages.send',
  NOTIFICATIONS_MANAGE: 'notifications.manage',
  COMMUNICATION_LOG: 'communication.log',

  // MR
  MR_LEADS_MANAGE: 'mr.leads.manage',
  MR_ONBOARDING_MANAGE: 'mr.onboarding.manage',

  // Content
  BLOG_MANAGE: 'blog.manage',
  REVIEW_MODERATE: 'review.moderate',

  // Platform
  REPORT_VIEW: 'report.view',
  REPORT_EXPORT: 'report.export',
  AUDIT_VIEW: 'audit.view',
  SECURITY_MANAGE: 'security.manage',
  SETTINGS_MANAGE: 'settings.manage',
  FEATURE_FLAGS_MANAGE: 'feature_flags.manage',
  INTEGRATIONS_MANAGE: 'integrations.manage',
  PLATFORM_ADMIN: 'platform.admin',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];
