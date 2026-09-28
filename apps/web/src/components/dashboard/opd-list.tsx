import Link from 'next/link';
import { CalendarX2, ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/states';
import { StatusPill, humanise, toneForStatus } from '@/components/ui/status-pill';
import { Button } from '@/components/ui/button';
import { ageFrom, formatTime } from '@/lib/utils';

export interface OpdAppointment {
  id: string;
  code: string;
  type: string;
  status: string;
  tokenNumber: number | null;
  scheduledStart: string;
  reason: string | null;
  isPaid: boolean;
  patient: {
    id: string;
    code: string;
    fullName: string;
    gender: string;
    dateOfBirth: string | null;
    approxAgeYears: number | null;
  };
  practiceLocation?: { location: { id: string; name: string } };
}

const TYPE_LABEL: Record<string, string> = {
  ONLINE: 'Online',
  OFFLINE: 'In clinic',
  WALK_IN: 'Walk-in',
  FOLLOW_UP: 'Follow-up',
  TELECONSULT: 'Teleconsult',
};

/**
 * Today's OPD. A table on desktop for scanning; stacked cards on mobile,
 * because a horizontally scrolling table is unusable between patients.
 */
export function OpdList({
  appointments,
  showLocation,
}: {
  appointments: OpdAppointment[];
  showLocation?: boolean;
}) {
  return (
    <Card>
      <CardHeader
        title="Today's OPD"
        description={
          appointments.length
            ? `${appointments.length} ${appointments.length === 1 ? 'appointment' : 'appointments'} scheduled`
            : undefined
        }
        action={
          <Link
            href="/portal/appointments"
            className="text-[12px] font-semibold text-teal-700 hover:underline"
          >
            View all
          </Link>
        }
      />

      {appointments.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="Nothing scheduled today"
          description="Bookings and walk-ins will appear here as they are created."
          action={
            <Button size="sm" variant="outline" asChild>
              <Link href="/portal/walk-in">Add a walk-in</Link>
            </Button>
          }
          className="pb-8"
        />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-y border-line bg-canvas text-left">
                  {['Token', 'Patient', 'Time', 'Visit type', 'Status', ''].map((h, i) => (
                    <th
                      key={h || i}
                      scope="col"
                      className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-navy-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="group transition-colors hover:bg-canvas">
                    <td className="px-5 py-3">
                      <span className="tnum grid size-8 place-items-center rounded-lg bg-navy-100 text-[12px] font-bold text-navy-700">
                        {appt.tokenNumber ? String(appt.tokenNumber).padStart(2, '0') : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={appt.patient.fullName} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-ink">
                            {appt.patient.fullName}
                          </p>
                          <p className="truncate text-[11px] text-muted">
                            {ageFrom(appt.patient.dateOfBirth, appt.patient.approxAgeYears)} ·{' '}
                            {appt.patient.gender.charAt(0) + appt.patient.gender.slice(1).toLowerCase()}
                            {showLocation && appt.practiceLocation
                              ? ` · ${appt.practiceLocation.location.name}`
                              : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="tnum whitespace-nowrap px-5 py-3 text-[13px] font-medium text-ink-2">
                      {formatTime(appt.scheduledStart)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[12px] font-medium text-ink-2">
                        {TYPE_LABEL[appt.type] ?? humanise(appt.type)}
                      </span>
                      {!appt.isPaid ? (
                        <span className="ml-1.5 text-[11px] font-semibold text-amber-600">
                          Unpaid
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill tone={toneForStatus(appt.status)} dot={appt.status === 'IN_CONSULTATION'}>
                        {humanise(appt.status)}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/portal/appointments/${appt.id}`}
                        aria-label={`Open appointment for ${appt.patient.fullName}`}
                        className="inline-grid size-8 place-items-center rounded-lg text-navy-400 opacity-0 transition-opacity hover:bg-navy-100 hover:text-ink group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <ChevronRight className="size-4" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <ul className="divide-y divide-line lg:hidden">
            {appointments.map((appt) => (
              <li key={appt.id}>
                <Link
                  href={`/portal/appointments/${appt.id}`}
                  className="flex items-center gap-3 px-4 py-3 active:bg-canvas"
                >
                  <span className="tnum grid size-9 shrink-0 place-items-center rounded-lg bg-navy-100 text-[12px] font-bold text-navy-700">
                    {appt.tokenNumber ? String(appt.tokenNumber).padStart(2, '0') : '—'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-ink">
                      {appt.patient.fullName}
                    </p>
                    <p className="tnum truncate text-[11.5px] text-muted">
                      {formatTime(appt.scheduledStart)} ·{' '}
                      {ageFrom(appt.patient.dateOfBirth, appt.patient.approxAgeYears)} ·{' '}
                      {TYPE_LABEL[appt.type] ?? humanise(appt.type)}
                    </p>
                  </div>
                  <StatusPill tone={toneForStatus(appt.status)}>{humanise(appt.status)}</StatusPill>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
