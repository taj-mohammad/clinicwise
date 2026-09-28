import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { StatusPill, humanise, toneForStatus } from '@/components/ui/status-pill';
import { PageHeader } from '@/components/shell/page-header';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { serverFetch } from '@/lib/server-session';
import { formatTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Calendar' };

interface Appt {
  id: string; code: string; status: string; type: string; scheduledStart: string;
  patient: { fullName: string };
  doctor: { user: { fullName: string } };
}

export default async function CalendarPage() {
  let rows: Appt[] = [];
  try {
    const res = await serverFetch<{ rows: Appt[] }>('/resources/appointments?pageSize=100');
    rows = res.rows;
  } catch {
    return <ErrorState title="We could not load the calendar" />;
  }

  // Group by day so the week reads as a schedule rather than a flat list.
  const byDay = new Map<string, Appt[]>();
  for (const appt of rows) {
    const key = new Date(appt.scheduledStart).toDateString();
    byDay.set(key, [...(byDay.get(key) ?? []), appt]);
  }
  const days = [...byDay.entries()].sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime(),
  ).slice(0, 14);

  return (
    <>
      <PageHeader title="Calendar" description="Appointments grouped by day" />

      {days.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarDays} title="Nothing scheduled" className="py-14" />
        </Card>
      ) : (
        <div className="space-y-4">
          {days.map(([day, appts]) => {
            const date = new Date(day);
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <Card key={day}>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      {date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                      {isToday ? <StatusPill tone="active">Today</StatusPill> : null}
                    </span>
                  }
                  description={`${appts.length} ${appts.length === 1 ? 'appointment' : 'appointments'}`}
                />
                <ul className="divide-y divide-line">
                  {appts
                    .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
                    .map((appt) => (
                      <li key={appt.id}>
                        <Link
                          href={`/portal/appointments/${appt.id}`}
                          className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-canvas"
                        >
                          <span className="tnum w-16 shrink-0 text-[12.5px] font-semibold text-ink-2">
                            {formatTime(appt.scheduledStart)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-ink">
                              {appt.patient.fullName}
                            </span>
                            <span className="block truncate text-[11px] text-muted">
                              {appt.doctor.user.fullName} · {humanise(appt.type)}
                            </span>
                          </span>
                          <StatusPill tone={toneForStatus(appt.status)}>{humanise(appt.status)}</StatusPill>
                        </Link>
                      </li>
                    ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
