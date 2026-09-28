import type { Metadata } from 'next';
import { Clock, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardHeader } from '@/components/ui/card';
import { StatusPill, humanise, toneForStatus } from '@/components/ui/status-pill';
import { PageHeader } from '@/components/shell/page-header';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { serverFetch } from '@/lib/server-session';
import { ageFrom, formatDuration, formatTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Live Queue' };

interface QueueData {
  date: string;
  queues: {
    id: string; status: string; currentToken: number | null;
    lastIssuedToken: number; avgConsultMin: number; waiting: number; completed: number;
    practiceLocation: {
      id: string;
      doctor: { id: string; user: { fullName: string } };
      location: { id: string; name: string; city: string | null; clinic: { name: string } };
    };
    entries: {
      id: string; tokenNumber: number; position: number; status: string;
      joinedAt: string; calledAt: string | null;
      patient: { id: string; code: string; fullName: string; gender: string; dateOfBirth: string | null; approxAgeYears: number | null; mobile: string };
      appointment: { id: string; type: string; reason: string | null; isPaid: boolean } | null;
    }[];
  }[];
}

export default async function QueuePage() {
  let data: QueueData;
  try {
    data = await serverFetch<QueueData>('/queue/today');
  } catch {
    return <ErrorState title="We could not load the queue" />;
  }

  return (
    <>
      <PageHeader
        title="Live queue"
        description={new Date(data.date).toLocaleDateString('en-IN', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })}
      />

      {data.queues.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No queue open today"
            description="A queue opens when the first patient is checked in for a doctor's session."
            className="py-14"
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {data.queues.map((queue) => {
            const active = queue.entries.find((e) => e.status === 'IN_CONSULTATION');
            const waiting = queue.entries.filter((e) => e.status === 'WAITING');
            const done = queue.entries.filter((e) => ['COMPLETED', 'NO_SHOW', 'SKIPPED'].includes(e.status));

            return (
              <Card key={queue.id}>
                <CardHeader
                  title={queue.practiceLocation.doctor.user.fullName}
                  description={`${queue.practiceLocation.location.clinic.name} · ${queue.practiceLocation.location.city ?? ''}`}
                  action={
                    <StatusPill tone={queue.status === 'OPEN' ? 'success' : 'neutral'} dot>
                      {humanise(queue.status)}
                    </StatusPill>
                  }
                />

                <div className="grid gap-3 px-5 pb-4 sm:grid-cols-4">
                  <Metric label="Now serving" value={queue.currentToken ? `#${String(queue.currentToken).padStart(3, '0')}` : '—'} tone="teal" />
                  <Metric label="Waiting" value={String(waiting.length)} tone="amber" />
                  <Metric label="Completed" value={String(queue.completed)} tone="green" />
                  <Metric label="Est. clear time" value={formatDuration(waiting.length * queue.avgConsultMin)} tone="navy" />
                </div>

                {active ? (
                  <div className="mx-5 mb-4 animate-pulse-ring rounded-xl border border-teal-200 bg-teal-50/70 p-3.5">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-teal-700">
                      In consultation
                    </p>
                    <EntryRow entry={active} />
                  </div>
                ) : null}

                {waiting.length > 0 ? (
                  <div className="border-t border-line">
                    <p className="px-5 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-wider text-navy-400">
                      Waiting ({waiting.length})
                    </p>
                    <ul className="divide-y divide-line">
                      {waiting.map((entry) => (
                        <li key={entry.id} className="px-5 py-2.5">
                          <EntryRow entry={entry} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {done.length > 0 ? (
                  <details className="border-t border-line">
                    <summary className="cursor-pointer px-5 py-2.5 text-[12px] font-semibold text-muted hover:text-ink">
                      Show {done.length} finished {done.length === 1 ? 'visit' : 'visits'}
                    </summary>
                    <ul className="divide-y divide-line border-t border-line">
                      {done.map((entry) => (
                        <li key={entry.id} className="px-5 py-2.5 opacity-70">
                          <EntryRow entry={entry} />
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}

                {queue.entries.length === 0 ? (
                  <EmptyState icon={Users} title="Nobody in this queue yet" className="pb-8" />
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'teal' | 'amber' | 'green' | 'navy' }) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700',
    amber: 'bg-warning-soft text-amber-700',
    green: 'bg-success-soft text-success',
    navy: 'bg-navy-100 text-navy-700',
  };
  return (
    <div className={`rounded-xl px-3 py-2.5 ${tones[tone]}`}>
      <p className="tnum text-[20px] font-bold leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-semibold">{label}</p>
    </div>
  );
}

function EntryRow({ entry }: { entry: QueueData['queues'][0]['entries'][0] }) {
  const waitedMin = Math.max(0, Math.round((Date.now() - new Date(entry.joinedAt).getTime()) / 60_000));

  return (
    <div className="flex items-center gap-3">
      <span className="tnum grid size-9 shrink-0 place-items-center rounded-lg bg-navy-900 text-[12px] font-bold text-white">
        {String(entry.tokenNumber).padStart(2, '0')}
      </span>
      <Avatar name={entry.patient.fullName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink">{entry.patient.fullName}</p>
        <p className="truncate text-[11px] text-muted">
          {ageFrom(entry.patient.dateOfBirth, entry.patient.approxAgeYears)} · {humanise(entry.patient.gender)}
          {entry.appointment?.reason ? ` · ${entry.appointment.reason}` : ''}
        </p>
      </div>
      {entry.appointment && !entry.appointment.isPaid ? (
        <StatusPill tone="warning" className="hidden sm:inline-flex">Unpaid</StatusPill>
      ) : null}
      <span className="tnum hidden shrink-0 items-center gap-1 text-[11px] text-muted sm:flex">
        <Clock className="size-3" aria-hidden />
        {entry.calledAt ? formatTime(entry.calledAt) : `${waitedMin}m`}
      </span>
      <StatusPill tone={toneForStatus(entry.status)}>{humanise(entry.status)}</StatusPill>
    </div>
  );
}
