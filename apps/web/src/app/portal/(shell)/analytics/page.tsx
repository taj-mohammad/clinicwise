import type { Metadata } from 'next';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/shell/page-header';
import { ErrorState } from '@/components/ui/states';
import { TrendChart } from '@/components/dashboard/charts';
import { serverFetch } from '@/lib/server-session';
import { Activity, CalendarCheck, Repeat2, Users2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Analytics' };

interface DoctorData {
  kpis: {
    appointmentsToday: number; completedToday: number; followUpsToday: number;
    consultationsThisWeek: number; consultationsThisMonth: number;
  };
  locations: { id: string; name: string; clinicName: string; city: string | null }[];
}

export default async function AnalyticsPage() {
  let data: DoctorData;
  let trend: { day: string; appointments: number; consultations: number }[] = [];
  try {
    data = await serverFetch<DoctorData>('/dashboard/doctor');
    const platform = await serverFetch<{ trend: typeof trend }>('/dashboard/platform').catch(() => null);
    trend = platform?.trend ?? [];
  } catch {
    return <ErrorState title="We could not load your analytics" />;
  }

  return (
    <>
      <PageHeader title="Analytics" description="Your consultation volume and reach" />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Consultations this week" value={data.kpis.consultationsThisWeek} icon={Activity} tone="teal" />
        <StatCard label="Consultations this month" value={data.kpis.consultationsThisMonth} icon={CalendarCheck} tone="cyan" />
        <StatCard label="Follow-ups today" value={data.kpis.followUpsToday} icon={Repeat2} tone="violet" />
        <StatCard label="Practice locations" value={data.locations.length} icon={Users2} tone="amber" />
      </section>

      {trend.length > 0 ? (
        <Card className="mb-5">
          <CardHeader title="Platform activity" description="Last 30 days" />
          <CardBody>
            <TrendChart data={trend} />
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Your locations" description="Where you currently practise" />
        <CardBody>
          <ul className="space-y-2">
            {data.locations.map((loc) => (
              <li
                key={loc.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-ink">{loc.clinicName}</span>
                  <span className="block truncate text-[11.5px] text-muted">{loc.city ?? loc.name}</span>
                </span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </>
  );
}
