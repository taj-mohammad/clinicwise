import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Activity, Building2, CalendarCheck, Database, FlaskConical, HardDrive,
  HeartPulse, Pill, Server, ShieldAlert, Stethoscope, UserCog, Users,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { StatusPill } from '@/components/ui/status-pill';
import { PageHeader } from '@/components/shell/page-header';
import { ErrorState } from '@/components/ui/states';
import { TrendChart, CityBars } from '@/components/dashboard/charts';
import { serverFetch } from '@/lib/server-session';
import { formatCurrency, formatNumber } from '@/lib/utils';

export const metadata: Metadata = { title: 'Platform Dashboard' };

interface PlatformData {
  kpis: {
    organizations: number; clinics: number; doctors: number; patients: number;
    staff: number; pharmacies: number; labs: number;
    appointmentsToday: number; consultationsToday: number; revenue30d: number;
  };
  operations: { pendingDoctorVerifications: number };
  trend: { day: string; appointments: number; consultations: number }[];
  topCities: { city: string; count: number }[];
}

interface HealthData {
  status: string;
  uptimeSeconds: number;
  checks: Record<string, { ok: boolean; latencyMs: number }>;
}

export default async function AdminDashboard() {
  let data: PlatformData;
  let health: HealthData | null = null;
  try {
    data = await serverFetch<PlatformData>('/dashboard/platform');
    health = await serverFetch<HealthData>('/health').catch(() => null);
  } catch {
    return <ErrorState title="We could not load the platform dashboard" />;
  }

  const { kpis } = data;

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Every organisation, clinic and partner on CliniqX"
      />

      <section aria-label="Platform totals" className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Organizations" value={kpis.organizations} icon={Building2} tone="navy" href="/admin/organizations" />
        <StatCard label="Clinics" value={kpis.clinics} icon={HeartPulse} tone="teal" href="/admin/clinics" />
        <StatCard label="Doctors" value={kpis.doctors} icon={Stethoscope} tone="cyan" href="/admin/doctors" />
        <StatCard label="Patients" value={formatNumber(kpis.patients)} icon={Users} tone="violet" href="/admin/patients" />
        <StatCard label="Staff" value={kpis.staff} icon={UserCog} tone="amber" href="/admin/staff" />
      </section>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Appointments today" value={kpis.appointmentsToday} icon={CalendarCheck} tone="cyan" href="/admin/appointments" />
        <StatCard label="Consultations today" value={kpis.consultationsToday} icon={Activity} tone="green" href="/admin/consultations" />
        <StatCard label="Pharmacies" value={kpis.pharmacies} icon={Pill} tone="teal" href="/admin/pharmacies" />
        <StatCard label="Labs" value={kpis.labs} icon={FlaskConical} tone="violet" href="/admin/labs" />
        <StatCard label="Collected (30 days)" value={formatCurrency(kpis.revenue30d, { compact: true })} icon={Activity} tone="green" href="/admin/payments" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader
              title="Appointment & consultation trend"
              description="Last 30 days across the platform"
            />
            <CardBody>
              <TrendChart data={data.trend} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Patients by city" description="Where care is being delivered" />
            <CardBody>
              <CityBars data={data.topCities} />
            </CardBody>
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader title="System health" description="Live service checks" />
            <CardBody className="space-y-2.5">
              <HealthRow
                icon={Server}
                label="API server"
                ok={Boolean(health)}
                detail={health ? `up ${Math.floor(health.uptimeSeconds / 60)} min` : 'unreachable'}
              />
              <HealthRow
                icon={Database}
                label="Database"
                ok={health?.checks.database?.ok ?? false}
                detail={health?.checks.database ? `${health.checks.database.latencyMs} ms` : '—'}
              />
              <HealthRow
                icon={HardDrive}
                label="Cache"
                ok={health?.checks.cache?.ok ?? false}
                detail={health?.checks.cache ? `${health.checks.cache.latencyMs} ms` : '—'}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Needs attention" />
            <CardBody className="space-y-2">
              <OpsRow
                href="/admin/doctors?status=PENDING_VERIFICATION"
                label="Doctor verifications pending"
                count={data.operations.pendingDoctorVerifications}
              />
              <OpsRow href="/admin/security?severity=critical" label="Critical security events" count={0} />
              <OpsRow href="/admin/audit" label="Audit trail" count={0} labelOnly />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Governance" />
            <CardBody className="space-y-1.5">
              <GovLink href="/admin/roles" icon={ShieldAlert} label="Roles & permissions" />
              <GovLink href="/admin/audit" icon={Activity} label="Audit logs" />
              <GovLink href="/admin/security" icon={ShieldAlert} label="Security events" />
              <GovLink href="/admin/settings" icon={Server} label="System settings" />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function HealthRow({
  icon: Icon, label, ok, detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-navy-400" aria-hidden />
      <span className="flex-1 text-[13px] font-medium text-ink-2">{label}</span>
      <span className="tnum text-[11px] text-muted">{detail}</span>
      <StatusPill tone={ok ? 'success' : 'danger'} dot>
        {ok ? 'Online' : 'Down'}
      </StatusPill>
    </div>
  );
}

function OpsRow({
  href, label, count, labelOnly,
}: {
  href: string;
  label: string;
  count: number;
  labelOnly?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5 transition-colors hover:bg-canvas"
    >
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-2">{label}</span>
      {labelOnly ? (
        <span className="text-[12px] font-semibold text-teal-700">Open →</span>
      ) : (
        <span
          className={`tnum grid h-6 min-w-6 place-items-center rounded-full px-2 text-[11px] font-bold ${
            count > 0 ? 'bg-warning-soft text-amber-700' : 'bg-success-soft text-success'
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function GovLink({
  href, icon: Icon, label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:bg-canvas hover:text-ink"
    >
      <Icon className="size-4 text-navy-400" aria-hidden />
      {label}
    </Link>
  );
}
