import Link from 'next/link';
import { ArrowRight, ClipboardCheck, CreditCard, Search, Ticket, UserPlus } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shell/page-header';
import { serverFetch } from '@/lib/server-session';
import { Avatar } from '@/components/ui/avatar';
import { StatusPill, humanise, toneForStatus } from '@/components/ui/status-pill';
import { formatTime } from '@/lib/utils';

const STEPS = [
  { icon: Search, title: 'Find the patient', body: 'Search by mobile number or name. Reception sees a match across the clinic.' },
  { icon: UserPlus, title: 'Or register them', body: 'A new patient gets a permanent CliniqX ID on first visit.' },
  { icon: Ticket, title: 'Issue a token', body: 'Pick the doctor and location; the next token is allocated automatically.' },
  { icon: CreditCard, title: 'Take payment', body: 'Optional at check-in. Cash, UPI, card or a payment link.' },
  { icon: ClipboardCheck, title: 'Check in', body: 'The patient joins the live queue and the doctor sees them immediately.' },
];

interface Appt {
  id: string; code: string; status: string; type: string; scheduledStart: string;
  tokenNumber: number | null;
  patient: { fullName: string };
  doctor: { user: { fullName: string } };
}

/** Walk-in registration desk: the flow, plus the walk-ins already taken today. */
export async function WalkInFlow() {
  let todays: Appt[] = [];
  try {
    const res = await serverFetch<{ rows: Appt[] }>('/resources/appointments?type=WALK_IN&pageSize=15');
    todays = res.rows;
  } catch {
    todays = [];
  }

  return (
    <>
      <PageHeader
        title="Walk-in OPD"
        description="Register and check in a patient who has arrived without an appointment"
        actions={
          <Button asChild>
            <Link href="/portal/patients/new">
              <UserPlus className="size-4" aria-hidden />
              New patient
            </Link>
          </Button>
        }
      />

      <Card className="mb-5">
        <CardHeader title="Start a walk-in" description="Search for the patient first — most have visited before." />
        <CardBody>
          <form action="/portal/patients" className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-navy-300" aria-hidden />
              <input
                type="search"
                name="q"
                placeholder="Mobile number or patient name"
                aria-label="Search for a patient"
                className="h-11 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-navy-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/15"
              />
            </div>
            <Button type="submit" size="lg" className="sm:w-auto">
              Search
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card className="mb-5">
        <CardHeader title="How a walk-in works" />
        <CardBody>
          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
                  <step.icon className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 border-b border-line pb-3 last:border-0 last:pb-0">
                  <p className="text-[13.5px] font-semibold text-ink">
                    <span className="tnum mr-1.5 text-muted">{i + 1}.</span>
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Recent walk-ins"
          description={`${todays.length} recorded`}
          action={
            <Link href="/portal/queue" className="text-[12px] font-semibold text-teal-700 hover:underline">
              Open queue
            </Link>
          }
        />
        {todays.length === 0 ? (
          <p className="px-5 pb-6 text-[13px] text-muted">No walk-ins recorded yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {todays.map((appt) => (
              <li key={appt.id} className="flex items-center gap-3 px-5 py-2.5">
                <span className="tnum grid size-8 shrink-0 place-items-center rounded-lg bg-navy-100 text-[12px] font-bold text-navy-700">
                  {appt.tokenNumber ? String(appt.tokenNumber).padStart(2, '0') : '—'}
                </span>
                <Avatar name={appt.patient.fullName} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink">{appt.patient.fullName}</span>
                  <span className="block truncate text-[11px] text-muted">{appt.doctor.user.fullName}</span>
                </span>
                <span className="tnum hidden shrink-0 text-[12px] text-muted sm:block">
                  {formatTime(appt.scheduledStart)}
                </span>
                <StatusPill tone={toneForStatus(appt.status)}>{humanise(appt.status)}</StatusPill>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
