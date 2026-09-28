import Link from 'next/link';
import {
  BadgeIndianRupee, CalendarCheck, CalendarPlus, CircleDollarSign, ClipboardCheck,
  FileText, FlaskConical, Receipt, TriangleAlert, UserCheck, UserPlus, Users2, Wallet,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { QuickAction } from '@/components/ui/quick-action';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/states';
import { StatusPill, humanise, toneForStatus } from '@/components/ui/status-pill';
import { ageFrom, formatCurrency, formatTime, greeting } from '@/lib/utils';
import type { SessionUser } from '@/hooks/use-session';

export interface ClinicDashboardData {
  kpis: {
    appointmentsToday: number; walkIns: number; waiting: number; completed: number;
    noShows: number; doctorsOnDuty: number; staffPresent: number; staffLate: number;
    staffAbsent: number; collectedToday: number; paymentCount: number;
    outstanding: number; outstandingCount: number; labOrders: number; reportsReady: number;
  };
  appointments: {
    id: string; code: string; status: string; type: string; tokenNumber: number | null;
    scheduledStart: string;
    patient: { id: string; fullName: string; dateOfBirth: string | null; approxAgeYears: number | null; gender: string };
    doctor: { id: string; user: { fullName: string } };
  }[];
  doctors: { id: string; name: string; isOnline: boolean }[];
}

export function ClinicDashboard({
  data,
  user,
}: {
  data: ClinicDashboardData;
  user: SessionUser;
}) {
  const { kpis } = data;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-muted">{greeting()}</p>
          <h1 className="mt-0.5 text-[22px] font-bold tracking-tight text-ink lg:text-[26px]">
            {user.fullName.split(' ')[0]}, here is today
          </h1>
        </div>
        <p className="tnum text-[13px] text-muted">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      <section aria-label="Today at a glance" className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Appointments today" value={kpis.appointmentsToday} icon={CalendarCheck}
          tone="cyan" href="/portal/appointments" actionLabel="Open schedule"
        />
        <StatCard
          label="Waiting patients" value={kpis.waiting} icon={Users2}
          tone="amber" href="/portal/queue" actionLabel="Open queue"
        />
        <StatCard
          label="Completed" value={kpis.completed} icon={ClipboardCheck}
          tone="green" href="/portal/consultations" actionLabel="Review"
        />
        <StatCard
          label="Collected today" value={formatCurrency(kpis.collectedToday)} icon={BadgeIndianRupee}
          tone="teal" href="/portal/payments" actionLabel="View payments"
        />
      </section>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Walk-ins" value={kpis.walkIns} icon={UserPlus} tone="violet" href="/portal/walk-in" />
        <StatCard label="No-shows" value={kpis.noShows} icon={TriangleAlert} tone="red" href="/portal/appointments?status=NO_SHOW" />
        <StatCard
          label="Outstanding payments" value={formatCurrency(kpis.outstanding)} icon={Receipt}
          tone="amber" href="/portal/payments?status=pending"
          delta={kpis.outstandingCount ? { value: `${kpis.outstandingCount}`, direction: 'down', label: 'invoices' } : undefined}
        />
        <StatCard label="Reports ready" value={kpis.reportsReady} icon={FlaskConical} tone="cyan" href="/portal/lab-orders?status=REPORT_READY" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader
              title="Today's appointments"
              description={`${data.appointments.length} shown`}
              action={
                <Link href="/portal/appointments" className="text-[12px] font-semibold text-teal-700 hover:underline">
                  View all
                </Link>
              }
            />
            {data.appointments.length === 0 ? (
              <EmptyState
                icon={CalendarPlus}
                title="No appointments today"
                description="New bookings and walk-ins will appear here."
                className="pb-8"
              />
            ) : (
              <ul className="divide-y divide-line">
                {data.appointments.map((appt) => (
                  <li key={appt.id}>
                    <Link
                      href={`/portal/appointments/${appt.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-canvas"
                    >
                      <span className="tnum grid size-9 shrink-0 place-items-center rounded-lg bg-navy-100 text-[12px] font-bold text-navy-700">
                        {appt.tokenNumber ? String(appt.tokenNumber).padStart(2, '0') : '—'}
                      </span>
                      <Avatar name={appt.patient.fullName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">{appt.patient.fullName}</p>
                        <p className="tnum truncate text-[11px] text-muted">
                          {ageFrom(appt.patient.dateOfBirth, appt.patient.approxAgeYears)} ·{' '}
                          {appt.doctor.user.fullName}
                        </p>
                      </div>
                      <span className="tnum hidden shrink-0 text-[12px] font-medium text-ink-2 sm:block">
                        {formatTime(appt.scheduledStart)}
                      </span>
                      <StatusPill tone={toneForStatus(appt.status)}>{humanise(appt.status)}</StatusPill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Quick actions" />
            <CardBody className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction label="Add patient" icon={UserPlus} href="/portal/patients/new" tone="teal" />
              <QuickAction label="Book appointment" icon={CalendarPlus} href="/portal/appointments/new" tone="cyan" />
              <QuickAction label="Walk-in OPD" icon={Users2} href="/portal/walk-in" tone="violet" />
              <QuickAction label="Check-in patient" icon={UserCheck} href="/portal/queue" tone="green" />
              <QuickAction label="Record payment" icon={CircleDollarSign} href="/portal/payments/new" tone="teal" />
              <QuickAction label="Generate invoice" icon={Receipt} href="/portal/payments/invoices/new" tone="amber" />
              <QuickAction label="Upload prescription" icon={FileText} href="/portal/prescriptions/upload" tone="navy" />
              <QuickAction label="Add staff" icon={UserPlus} href="/portal/staff/new" tone="cyan" />
            </CardBody>
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader
              title="Staff attendance"
              description="Today"
              action={
                <Link href="/portal/attendance" className="text-[12px] font-semibold text-teal-700 hover:underline">
                  Manage
                </Link>
              }
            />
            <CardBody>
              <div className="grid grid-cols-3 gap-2.5">
                <AttendanceTile label="Present" value={kpis.staffPresent} tone="green" />
                <AttendanceTile label="Late" value={kpis.staffLate} tone="amber" />
                <AttendanceTile label="Absent" value={kpis.staffAbsent} tone="red" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Doctors on duty" description={`${data.doctors.length} today`} />
            <CardBody>
              {data.doctors.length === 0 ? (
                <p className="py-3 text-center text-[13px] text-muted">No doctors scheduled today.</p>
              ) : (
                <ul className="space-y-2.5">
                  {data.doctors.slice(0, 6).map((doc) => (
                    <li key={doc.id} className="flex items-center gap-2.5">
                      <Avatar name={doc.name} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                        {doc.name}
                      </span>
                      <StatusPill tone={doc.isOnline ? 'success' : 'neutral'} dot>
                        {doc.isOnline ? 'Online' : 'Offline'}
                      </StatusPill>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Pending tasks" />
            <CardBody className="space-y-2">
              <TaskRow
                href="/portal/lab-orders?status=REPORT_READY"
                label="Lab reports to hand over"
                count={kpis.reportsReady}
              />
              <TaskRow
                href="/portal/payments?status=pending"
                label="Invoices awaiting payment"
                count={kpis.outstandingCount}
              />
              <TaskRow
                href="/portal/appointments?status=NO_SHOW"
                label="No-shows to follow up"
                count={kpis.noShows}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function AttendanceTile({
  label, value, tone,
}: {
  label: string;
  value: number;
  tone: 'green' | 'amber' | 'red';
}) {
  const tones = {
    green: 'bg-success-soft text-success',
    amber: 'bg-warning-soft text-amber-600',
    red: 'bg-danger-soft text-danger',
  };
  return (
    <div className={`rounded-xl px-3 py-3 text-center ${tones[tone]}`}>
      <p className="tnum text-[22px] font-bold leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-semibold">{label}</p>
    </div>
  );
}

function TaskRow({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5 transition-colors hover:bg-canvas"
    >
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-2">{label}</span>
      <span
        className={`tnum grid h-6 min-w-6 place-items-center rounded-full px-2 text-[11px] font-bold ${
          count > 0 ? 'bg-warning-soft text-amber-700' : 'bg-navy-100 text-navy-400'
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
