import {
  Activity, BadgeIndianRupee, Bell, Building2, CalendarDays, ClipboardList, Clock,
  CreditCard, FileText, FlaskConical, Gauge, HeartPulse, Home, LayoutDashboard,
  type LucideIcon, MessageSquare, Package, Pill, Receipt, Salad, ScrollText,
  Settings, Share2, Shield, ShieldCheck, Stethoscope, Truck, UserCog, UserPlus,
  Users, Wallet,
} from 'lucide-react';
import { PERMISSIONS, type Permission } from '@cliniqx/shared';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Hidden unless the actor holds this permission. Presentation only — the API re-checks. */
  permission?: Permission;
  badgeKey?: 'waiting' | 'unreadMessages' | 'pendingTasks' | 'reportsReady';
  children?: NavItem[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const SUPER_ADMIN_NAV: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Organizations', href: '/admin/organizations', icon: Building2, permission: PERMISSIONS.ORG_VIEW },
      { label: 'Clinics', href: '/admin/clinics', icon: HeartPulse, permission: PERMISSIONS.CLINIC_VIEW },
      { label: 'Doctors', href: '/admin/doctors', icon: Stethoscope, permission: PERMISSIONS.DOCTORS_VIEW },
      { label: 'Staff', href: '/admin/staff', icon: UserCog, permission: PERMISSIONS.STAFF_VIEW },
      { label: 'Patients', href: '/admin/patients', icon: Users, permission: PERMISSIONS.PATIENTS_VIEW },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Appointments', href: '/admin/appointments', icon: CalendarDays, permission: PERMISSIONS.APPOINTMENTS_VIEW },
      { label: 'Consultations', href: '/admin/consultations', icon: ClipboardList, permission: PERMISSIONS.CONSULTATION_VIEW },
      { label: 'Labs', href: '/admin/labs', icon: FlaskConical, permission: PERMISSIONS.LAB_REPORT_VIEW },
      { label: 'Pharmacies', href: '/admin/pharmacies', icon: Pill, permission: PERMISSIONS.PHARMACY_ORDER_VIEW },
      { label: 'MR Network', href: '/admin/mr', icon: Share2, permission: PERMISSIONS.MR_LEADS_MANAGE },
      { label: 'Payments', href: '/admin/payments', icon: CreditCard, permission: PERMISSIONS.PAYMENT_VIEW },
    ],
  },
  {
    title: 'Platform',
    items: [
      { label: 'Reports', href: '/admin/reports', icon: Gauge, permission: PERMISSIONS.REPORT_VIEW },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Roles & Permissions', href: '/admin/roles', icon: ShieldCheck, permission: PERMISSIONS.SECURITY_MANAGE },
      { label: 'Audit Logs', href: '/admin/audit', icon: ScrollText, permission: PERMISSIONS.AUDIT_VIEW },
      { label: 'Security', href: '/admin/security', icon: Shield, permission: PERMISSIONS.SECURITY_MANAGE },
      { label: 'System Settings', href: '/admin/settings', icon: Settings, permission: PERMISSIONS.SETTINGS_MANAGE },
    ],
  },
];

export const CLINIC_ADMIN_NAV: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/portal', icon: LayoutDashboard },
      { label: 'Doctors', href: '/portal/doctors', icon: Stethoscope, permission: PERMISSIONS.DOCTORS_VIEW },
      { label: 'Staff', href: '/portal/staff', icon: UserCog, permission: PERMISSIONS.STAFF_VIEW },
      { label: 'Patients', href: '/portal/patients', icon: Users, permission: PERMISSIONS.PATIENTS_VIEW },
    ],
  },
  {
    title: 'Today',
    items: [
      { label: 'Appointments', href: '/portal/appointments', icon: CalendarDays, permission: PERMISSIONS.APPOINTMENTS_VIEW },
      { label: 'Walk-In OPD', href: '/portal/walk-in', icon: UserPlus, permission: PERMISSIONS.APPOINTMENTS_CREATE },
      { label: 'Live Queue', href: '/portal/queue', icon: Clock, permission: PERMISSIONS.QUEUE_VIEW, badgeKey: 'waiting' },
      { label: 'Consultations', href: '/portal/consultations', icon: ClipboardList, permission: PERMISSIONS.CONSULTATION_VIEW },
      { label: 'Prescriptions', href: '/portal/prescriptions', icon: FileText, permission: PERMISSIONS.PRESCRIPTION_VIEW },
      { label: 'Lab Orders', href: '/portal/lab-orders', icon: FlaskConical, permission: PERMISSIONS.LAB_REPORT_VIEW },
    ],
  },
  {
    title: 'Finance & People',
    items: [
      { label: 'Payments', href: '/portal/payments', icon: CreditCard, permission: PERMISSIONS.PAYMENT_VIEW },
      { label: 'Expenses', href: '/portal/expenses', icon: Receipt, permission: PERMISSIONS.EXPENSE_MANAGE },
      { label: 'Attendance', href: '/portal/attendance', icon: Activity, permission: PERMISSIONS.ATTENDANCE_VIEW },
      { label: 'Payroll', href: '/portal/payroll', icon: Wallet, permission: PERMISSIONS.PAYROLL_VIEW },
      { label: 'Reports', href: '/portal/reports', icon: Gauge, permission: PERMISSIONS.REPORT_VIEW },
      { label: 'Settings', href: '/portal/settings', icon: Settings, permission: PERMISSIONS.SETTINGS_MANAGE },
    ],
  },
];

export const DOCTOR_NAV: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/portal', icon: LayoutDashboard },
      { label: 'Today OPD', href: '/portal/opd', icon: Stethoscope },
      { label: 'Appointments', href: '/portal/appointments', icon: CalendarDays },
      { label: 'Calendar', href: '/portal/calendar', icon: CalendarDays },
      { label: 'Live Queue', href: '/portal/queue', icon: Clock, badgeKey: 'waiting' },
      { label: 'Patients', href: '/portal/patients', icon: Users },
    ],
  },
  {
    title: 'Clinical',
    items: [
      { label: 'Consultations', href: '/portal/consultations', icon: ClipboardList },
      { label: 'Prescriptions', href: '/portal/prescriptions', icon: FileText },
      { label: 'Lab Orders', href: '/portal/lab-orders', icon: FlaskConical },
      { label: 'Medical Records', href: '/portal/records', icon: ScrollText },
      { label: 'Diet Plans', href: '/portal/diet-plans', icon: Salad },
    ],
  },
  {
    title: 'Practice',
    items: [
      { label: 'Messages', href: '/portal/messages', icon: MessageSquare, badgeKey: 'unreadMessages' },
      { label: 'Payments', href: '/portal/payments', icon: BadgeIndianRupee },
      { label: 'Analytics', href: '/portal/analytics', icon: Gauge },
      { label: 'Settings', href: '/portal/settings', icon: Settings },
    ],
  },
];

export const PHARMACY_NAV: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/pharmacy', icon: LayoutDashboard },
      { label: 'Orders', href: '/pharmacy/orders', icon: Package },
      { label: 'Prescriptions', href: '/pharmacy/prescriptions', icon: FileText },
      { label: 'Inventory', href: '/pharmacy/inventory', icon: Pill },
      { label: 'Delivery', href: '/pharmacy/delivery', icon: Truck },
      { label: 'Payments', href: '/pharmacy/payments', icon: CreditCard },
      { label: 'Settings', href: '/pharmacy/settings', icon: Settings },
    ],
  },
];

export const LAB_NAV: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/lab', icon: LayoutDashboard },
      { label: 'Orders', href: '/lab/orders', icon: ClipboardList },
      { label: 'Test Catalog', href: '/lab/tests', icon: FlaskConical },
      { label: 'Sample Collection', href: '/lab/collections', icon: Activity },
      { label: 'Reports', href: '/lab/reports', icon: FileText },
      { label: 'Settings', href: '/lab/settings', icon: Settings },
    ],
  },
];

export const MR_NAV: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/mr', icon: LayoutDashboard },
      { label: 'Doctors', href: '/mr/doctors', icon: Stethoscope },
      { label: 'Leads', href: '/mr/leads', icon: UserPlus },
      { label: 'Visits', href: '/mr/visits', icon: Activity },
      { label: 'Onboarding', href: '/mr/onboarding', icon: ClipboardList },
      { label: 'Targets', href: '/mr/targets', icon: Gauge },
      { label: 'Settings', href: '/mr/settings', icon: Settings },
    ],
  },
];

export const PATIENT_TABS: NavItem[] = [
  { label: 'Home', href: '/patient', icon: Home },
  { label: 'Appointments', href: '/patient/appointments', icon: CalendarDays },
  { label: 'Records', href: '/patient/records', icon: FileText },
  { label: 'Messages', href: '/patient/messages', icon: MessageSquare, badgeKey: 'unreadMessages' },
  { label: 'Profile', href: '/patient/profile', icon: UserCog },
];

/**
 * Nav sets are addressed by key so a server component can choose one without
 * passing icon components (functions) across the server/client boundary.
 */
export const NAV_SETS = {
  'super-admin': SUPER_ADMIN_NAV,
  'clinic-admin': CLINIC_ADMIN_NAV,
  doctor: DOCTOR_NAV,
  pharmacy: PHARMACY_NAV,
  lab: LAB_NAV,
  mr: MR_NAV,
} as const;

export type NavKey = keyof typeof NAV_SETS;
