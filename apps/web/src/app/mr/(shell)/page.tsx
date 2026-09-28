import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, CalendarClock, MapPin, Target, TrendingUp, UserCheck, UserPlus } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { StatusPill, humanise, toneForStatus } from '@/components/ui/status-pill';
import { PageHeader } from '@/components/shell/page-header';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { serverFetch } from '@/lib/server-session';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Field Dashboard' };

const PIPELINE = ['LEAD', 'CONTACTED', 'INTERESTED', 'DEMO', 'DOCUMENTS_PENDING', 'VERIFICATION', 'APPROVED', 'ACTIVATED'];

interface Data {
  profile: { code: string; territory: string | null; city: string | null; state: string | null; monthlyTargetDoctors: number };
  kpis: {
    totalLeads: number; activated: number; inPipeline: number;
    visitsThisMonth: number; dueToday: number; target: number; targetProgress: number;
  };
  stageCounts: Record<string, number>;
  dueFollowUps: { id: string; leadName: string; clinicName: string | null; city: string | null; stage: string; nextActionAt: string | null; leadMobile: string }[];
  recentLeads: { id: string; leadName: string; clinicName: string | null; city: string | null; stage: string; specialtyHint: string | null; updatedAt: string }[];
}

export default async function MrDashboard() {
  let data: Data;
  try {
    data = await serverFetch<Data>('/dashboard/mr');
  } catch {
    return <ErrorState title="We could not load your field dashboard" />;
  }

  const { kpis } = data;
  const maxStage = Math.max(1, ...PIPELINE.map((s) => data.stageCounts[s] ?? 0));

  return (
    <>
      <PageHeader
        title="Your territory"
        description={[data.profile.territory, data.profile.city].filter(Boolean).join(' · ') || 'Field operations'}
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total leads" value={kpis.totalLeads} icon={Briefcase} tone="cyan" href="/mr/leads" />
        <StatCard label="Doctors activated" value={kpis.activated} icon={UserCheck} tone="green" href="/mr/doctors" />
        <StatCard label="In pipeline" value={kpis.inPipeline} icon={UserPlus} tone="amber" href="/mr/onboarding" />
        <StatCard label="Visits this month" value={kpis.visitsThisMonth} icon={MapPin} tone="violet" href="/mr/visits" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader title="Onboarding pipeline" description="Leads by stage" />
            <CardBody>
              <ul className="space-y-2.5">
                {PIPELINE.map((stage) => {
                  const count = data.stageCounts[stage] ?? 0;
                  return (
                    <li key={stage}>
                      <div className="mb-1 flex items-baseline justify-between gap-3">
                        <Link
                          href={`/mr/leads?stage=${stage}`}
                          className="truncate text-[13px] font-medium text-ink-2 hover:underline"
                        >
                          {humanise(stage)}
                        </Link>
                        <span className="tnum shrink-0 text-[12px] font-semibold text-ink">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-navy-100">
                        <div
                          className="h-full rounded-full bg-cyan-500"
                          style={{ width: `${(count / maxStage) * 100}%` }}
                          role="presentation"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Recent leads"
              action={<Link href="/mr/leads" className="text-[12px] font-semibold text-teal-700 hover:underline">View all</Link>}
            />
            {data.recentLeads.length === 0 ? (
              <EmptyState icon={Briefcase} title="No leads yet" className="pb-8" />
            ) : (
              <ul className="divide-y divide-line">
                {data.recentLeads.slice(0, 8).map((lead) => (
                  <li key={lead.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={lead.leadName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{lead.leadName}</p>
                      <p className="truncate text-[11px] text-muted">
                        {[lead.clinicName, lead.city, lead.specialtyHint].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <StatusPill tone={toneForStatus(lead.stage)}>{humanise(lead.stage)}</StatusPill>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader title="Monthly target" description="Doctors activated this cycle" />
            <CardBody>
              <div className="flex items-baseline gap-2">
                <span className="tnum text-[32px] font-bold leading-none text-ink">{kpis.activated}</span>
                <span className="text-[14px] text-muted">of {kpis.target || '—'}</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-navy-100">
                <div
                  className="h-full rounded-full bg-teal-600 transition-[width]"
                  style={{ width: `${kpis.targetProgress}%` }}
                  role="progressbar"
                  aria-valuenow={kpis.targetProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Monthly target progress"
                />
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-teal-700">
                <TrendingUp className="size-3.5" aria-hidden />
                {kpis.targetProgress}% of target
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Due today"
              description={kpis.dueToday ? `${kpis.dueToday} follow-ups` : 'Nothing due'}
            />
            {data.dueFollowUps.length === 0 ? (
              <EmptyState icon={CalendarClock} title="You are all caught up" className="pb-6" />
            ) : (
              <ul className="divide-y divide-line">
                {data.dueFollowUps.map((lead) => (
                  <li key={lead.id} className="px-5 py-2.5">
                    <p className="truncate text-[13px] font-semibold text-ink">{lead.leadName}</p>
                    <p className="tnum truncate text-[11px] text-muted">
                      {lead.leadMobile} · {lead.nextActionAt ? formatDate(lead.nextActionAt) : 'no date'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Note" />
            <CardBody>
              <p className="text-[12.5px] leading-relaxed text-muted">
                Field accounts cover doctor acquisition only. Patient medical records are
                not accessible from this portal.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
