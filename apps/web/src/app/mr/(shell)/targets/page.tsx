import type { Metadata } from 'next';
import { Target, TrendingUp } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/shell/page-header';
import { ErrorState } from '@/components/ui/states';
import { serverFetch } from '@/lib/server-session';
import { humanise } from '@/components/ui/status-pill';

export const metadata: Metadata = { title: 'Targets' };

interface Data {
  profile: { code: string; territory: string | null; monthlyTargetDoctors: number };
  kpis: { activated: number; target: number; targetProgress: number; visitsThisMonth: number; totalLeads: number; inPipeline: number };
  stageCounts: Record<string, number>;
}

export default async function TargetsPage() {
  let data: Data;
  try {
    data = await serverFetch<Data>('/dashboard/mr');
  } catch {
    return <ErrorState title="We could not load your targets" />;
  }

  const { kpis } = data;
  const remaining = Math.max(0, kpis.target - kpis.activated);

  return (
    <>
      <PageHeader title="Targets" description={data.profile.territory ?? 'Your monthly objectives'} />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Target this month" value={kpis.target || '—'} icon={Target} tone="navy" />
        <StatCard label="Activated" value={kpis.activated} icon={TrendingUp} tone="green" />
        <StatCard label="Still needed" value={remaining} icon={Target} tone="amber" />
        <StatCard label="Visits logged" value={kpis.visitsThisMonth} icon={TrendingUp} tone="cyan" />
      </section>

      <Card>
        <CardHeader title="Progress" description="Doctors activated against target" />
        <CardBody>
          <div className="flex items-baseline gap-2">
            <span className="tnum text-[36px] font-bold leading-none text-ink">{kpis.targetProgress}%</span>
            <span className="text-[14px] text-muted">
              {kpis.activated} of {kpis.target || '—'}
            </span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-navy-100">
            <div
              className="h-full rounded-full bg-teal-600"
              style={{ width: `${kpis.targetProgress}%` }}
              role="progressbar"
              aria-valuenow={kpis.targetProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Target progress"
            />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(data.stageCounts).map(([stage, count]) => (
              <div key={stage} className="rounded-xl border border-line px-3 py-2.5">
                <dt className="truncate text-[11px] font-semibold text-muted">{humanise(stage)}</dt>
                <dd className="tnum mt-0.5 text-[18px] font-bold text-ink">{count}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>
    </>
  );
}
