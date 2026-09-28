import Link from 'next/link';
import {
  CalendarCheck, CalendarPlus, CircleDot, FileText, FlaskConical, MessageSquare,
  Repeat2, Salad, Send, Stethoscope, Upload, UserPlus, Users2,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { QuickAction } from '@/components/ui/quick-action';
import { StatCard } from '@/components/ui/stat-card';
import { LocationSwitcher } from '@/components/dashboard/location-switcher';
import { OpdList, type OpdAppointment } from '@/components/dashboard/opd-list';
import { QueueBoard, type QueueData } from '@/components/dashboard/queue-board';
import { formatNumber, greeting } from '@/lib/utils';
import type { SessionUser } from '@/hooks/use-session';

export interface DoctorDashboardData {
  locations: {
    id: string; name: string; city: string | null;
    clinicId: string; clinicName: string; consultationFee: number;
  }[];
  selectedLocationId: string | null;
  kpis: {
    appointmentsToday: number; waiting: number; completedToday: number;
    followUpsToday: number; reportsReady: number; unreadMessages: number;
    consultationsThisWeek: number; consultationsThisMonth: number;
  };
  appointments: OpdAppointment[];
  queue: QueueData;
}

export function DoctorDashboard({
  data,
  user,
}: {
  data: DoctorDashboardData;
  user: SessionUser;
}) {
  const { kpis } = data;
  const selected = data.locations.find((l) => l.id === data.selectedLocationId);
  const isOnline = true;

  return (
    <>
      {/* Greeting header */}
      <section className="mb-5 overflow-hidden rounded-card border border-line bg-navy-900 p-5 text-white lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={user.fullName} size="xl" className="ring-navy-700" />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-navy-300">
                {greeting()}, welcome back
              </p>
              <h1 className="mt-0.5 truncate text-[22px] font-bold tracking-tight lg:text-[26px]">
                {user.fullName}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-navy-300">
                {user.specialty ? <span>{user.specialty}</span> : null}
                {selected ? (
                  <>
                    <span aria-hidden className="text-navy-600">•</span>
                    <span>{selected.clinicName}</span>
                    {selected.city ? (
                      <>
                        <span aria-hidden className="text-navy-600">•</span>
                        <span>{selected.city}</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  <span>{data.locations.length} practice locations</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-600/15 px-3 py-1.5 text-[12px] font-semibold text-teal-300 ring-1 ring-inset ring-teal-600/30">
              <CircleDot className="size-3" aria-hidden />
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <div className="[&_button]:border-navy-700 [&_button]:bg-navy-800 [&_button]:text-navy-100 [&_button:hover]:bg-navy-700">
              <LocationSwitcher
                locations={data.locations}
                selectedId={data.selectedLocationId}
              />
            </div>
          </div>
        </div>
      </section>

      {/* KPIs — each leads somewhere */}
      <section aria-label="Today at a glance" className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's appointments"
          value={kpis.appointmentsToday}
          icon={CalendarCheck}
          tone="cyan"
          href="/portal/appointments"
          actionLabel="Open schedule"
        />
        <StatCard
          label="Waiting patients"
          value={kpis.waiting}
          icon={Users2}
          tone="amber"
          href="/portal/queue"
          actionLabel="Open queue"
        />
        <StatCard
          label="Completed today"
          value={kpis.completedToday}
          icon={Stethoscope}
          tone="green"
          href="/portal/consultations"
          actionLabel="Review"
        />
        <StatCard
          label="Follow-ups today"
          value={kpis.followUpsToday}
          icon={Repeat2}
          tone="violet"
          href="/portal/appointments?type=FOLLOW_UP"
          actionLabel="View"
        />
      </section>

      {/* Attention strip */}
      {kpis.reportsReady > 0 || kpis.unreadMessages > 0 ? (
        <section className="mb-5 grid gap-3 sm:grid-cols-2">
          {kpis.reportsReady > 0 ? (
            <AttentionCard
              icon={FlaskConical}
              tone="cyan"
              title={`${kpis.reportsReady} lab ${kpis.reportsReady === 1 ? 'report' : 'reports'} ready`}
              description="Results are waiting for your review."
              href="/portal/lab-orders?status=REPORT_READY"
              action="Review reports"
            />
          ) : null}
          {kpis.unreadMessages > 0 ? (
            <AttentionCard
              icon={MessageSquare}
              tone="amber"
              title={`${kpis.unreadMessages} unread ${kpis.unreadMessages === 1 ? 'message' : 'messages'}`}
              description="Patients are waiting for a reply."
              href="/portal/messages"
              action="Open messages"
            />
          ) : null}
        </section>
      ) : null}

      {/* Main grid */}
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-5">
          <OpdList appointments={data.appointments} showLocation={!data.selectedLocationId} />

          <Card>
            <CardHeader title="Quick actions" description="The things you do most often" />
            <CardBody className="grid gap-2.5 sm:grid-cols-2">
              <QuickAction label="Start consultation" icon={Stethoscope} href="/portal/queue" tone="teal" />
              <QuickAction label="Add walk-in" icon={UserPlus} href="/portal/walk-in" tone="cyan" />
              <QuickAction label="Create prescription" icon={FileText} href="/portal/prescriptions/new" tone="violet" />
              <QuickAction label="Upload prescription" icon={Upload} href="/portal/prescriptions/upload" tone="navy" />
              <QuickAction label="Order lab test" icon={FlaskConical} href="/portal/lab-orders/new" tone="amber" />
              <QuickAction label="Send advice" icon={Send} href="/portal/advice" tone="green" />
              <QuickAction label="Create diet plan" icon={Salad} href="/portal/diet-plans/new" tone="green" />
              <QuickAction label="Book appointment" icon={CalendarPlus} href="/portal/appointments/new" tone="cyan" />
            </CardBody>
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <QueueBoard queue={data.queue} />

          <Card>
            <CardHeader title="Your practice" description="Consultation volume" />
            <CardBody className="space-y-3">
              <MetricRow
                label="This week"
                value={formatNumber(kpis.consultationsThisWeek)}
                caption="consultations"
              />
              <MetricRow
                label="This month"
                value={formatNumber(kpis.consultationsThisMonth)}
                caption="consultations"
              />
              <MetricRow
                label="Practice locations"
                value={String(data.locations.length)}
                caption={data.locations.length === 1 ? 'clinic' : 'clinics'}
              />
              <Link
                href="/portal/analytics"
                className="block pt-1 text-[12px] font-semibold text-teal-700 hover:underline"
              >
                Open full analytics →
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function AttentionCard({
  icon: Icon, title, description, href, action, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  action: string;
  tone: 'cyan' | 'amber';
}) {
  const tones = {
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-600',
    amber: 'border-amber-200 bg-warning-soft text-amber-600',
  };
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3.5 rounded-card border p-4 transition-shadow hover:shadow-card ${tones[tone]}`}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/70">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-ink">{title}</p>
        <p className="truncate text-[12px] text-ink-2/70">{description}</p>
      </div>
      <span className="hidden shrink-0 text-[12px] font-semibold group-hover:underline sm:block">
        {action} →
      </span>
    </Link>
  );
}

function MetricRow({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-line pb-2.5 last:border-0 last:pb-0">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="tnum text-[18px] font-bold text-ink">{value}</span>
        <span className="text-[11px] text-muted">{caption}</span>
      </span>
    </div>
  );
}
