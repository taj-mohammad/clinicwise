import Link from 'next/link';
import {
  Activity, BadgeIndianRupee, CalendarCheck, ClipboardList, Download, FlaskConical,
  type LucideIcon, Receipt, Stethoscope, UserCheck, Users, Wallet,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/shell/page-header';

interface Report {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** The list view this report is derived from, so the link always resolves. */
  href: string;
}

const CLINIC_REPORTS: Report[] = [
  { key: 'appointments', title: 'Appointments', description: 'Volume, type and status over any period', icon: CalendarCheck, href: '/portal/appointments' },
  { key: 'patients', title: 'Patients', description: 'Registrations, demographics and locations', icon: Users, href: '/portal/patients' },
  { key: 'consultations', title: 'Consultations', description: 'Completed visits by doctor and diagnosis', icon: Stethoscope, href: '/portal/consultations' },
  { key: 'revenue', title: 'Revenue collected', description: 'Payments received by method and day', icon: BadgeIndianRupee, href: '/portal/payments?status=SUCCESS' },
  { key: 'outstanding', title: 'Outstanding payments', description: 'Invoices issued but not yet settled', icon: Receipt, href: '/portal/payments?status=PENDING' },
  { key: 'expenses', title: 'Expenses', description: 'Spend by category, vendor and approval state', icon: Wallet, href: '/portal/expenses' },
  { key: 'attendance', title: 'Attendance', description: 'Present, late and absent by staff member', icon: UserCheck, href: '/portal/attendance' },
  { key: 'payroll', title: 'Payroll', description: 'Cycles, gross and net payable', icon: Wallet, href: '/portal/payroll' },
  { key: 'labs', title: 'Lab orders', description: 'Orders raised, turnaround and reports delivered', icon: FlaskConical, href: '/portal/lab-orders' },
  { key: 'noshows', title: 'No-shows', description: 'Missed appointments to follow up', icon: ClipboardList, href: '/portal/appointments?status=NO_SHOW' },
];

const PLATFORM_REPORTS: Report[] = [
  { key: 'orgs', title: 'Organizations', description: 'Tenants, status and clinic counts', icon: Activity, href: '/admin/organizations' },
  { key: 'clinics', title: 'Clinics', description: 'Every clinic and its locations', icon: Activity, href: '/admin/clinics' },
  { key: 'doctors', title: 'Doctors', description: 'Onboarding state and practice locations', icon: Stethoscope, href: '/admin/doctors' },
  { key: 'patients', title: 'Patients', description: 'Growth and distribution by city', icon: Users, href: '/admin/patients' },
  { key: 'appointments', title: 'Appointments', description: 'Platform-wide booking volume', icon: CalendarCheck, href: '/admin/appointments' },
  { key: 'payments', title: 'Payments', description: 'Transactions across all clinics', icon: BadgeIndianRupee, href: '/admin/payments' },
  { key: 'audit', title: 'Audit trail', description: 'Who accessed what, and when', icon: ClipboardList, href: '/admin/audit' },
  { key: 'security', title: 'Security events', description: 'Failed sign-ins and denied access', icon: Activity, href: '/admin/security' },
];

export function ReportsPage({ scope }: { scope: 'clinic' | 'platform' }) {
  const reports = scope === 'platform' ? PLATFORM_REPORTS : CLINIC_REPORTS;

  return (
    <>
      <PageHeader
        title="Reports"
        description="Each report opens the underlying records, filtered and ready to export."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link
            key={report.key}
            href={report.href}
            className="group rounded-card border border-line bg-surface p-4 transition-shadow hover:shadow-raised"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-600">
              <report.icon className="size-5" aria-hidden />
            </span>
            <p className="mt-3 text-[14px] font-bold text-ink">{report.title}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{report.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-teal-700 group-hover:gap-1.5 transition-all">
              Open report →
            </span>
          </Link>
        ))}
      </div>

      <Card className="mt-5">
        <CardHeader title="Exports" description="Available from any list view" />
        <CardBody>
          <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
            <Download className="mt-0.5 size-4 shrink-0 text-navy-400" aria-hidden />
            Every report view can be filtered by date, clinic, doctor and location, then
            exported. Exports carry the same permission checks as the screen — you can
            only export rows you are allowed to read, and the download is recorded in the
            audit trail.
          </p>
        </CardBody>
      </Card>
    </>
  );
}
