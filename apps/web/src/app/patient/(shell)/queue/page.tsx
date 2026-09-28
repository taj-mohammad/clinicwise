import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Users } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { PageHeader } from '@/components/shell/page-header';
import { serverFetch } from '@/lib/server-session';
import { formatDuration, formatTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Live Queue' };

interface Data {
  nextAppointment: {
    id: string; scheduledStart: string; tokenNumber: number | null;
    doctor: { user: { fullName: string } };
    practiceLocation: { location: { name: string; city: string | null; clinic: { name: string } } };
  } | null;
  queue: { currentToken: number | null; myToken: number | null; ahead: number; etaMinutes: number } | null;
}

export default async function PatientQueuePage() {
  let data: Data;
  try {
    data = await serverFetch<Data>('/dashboard/patient');
  } catch {
    return <ErrorState title="We could not load the queue" />;
  }

  if (!data.queue?.myToken) {
    return (
      <>
        <PageHeader title="Live queue" />
        <Card>
          <EmptyState
            icon={Users}
            title="You are not in a queue right now"
            description={
              data.nextAppointment
                ? 'Your token appears here once reception checks you in at the clinic.'
                : 'Book an appointment to join a queue.'
            }
            action={
              <Button size="sm" asChild>
                <Link href={data.nextAppointment ? '/patient/appointments' : '/patient/doctors'}>
                  {data.nextAppointment ? 'View appointment' : 'Find a doctor'}
                </Link>
              </Button>
            }
            className="py-12"
          />
        </Card>
      </>
    );
  }

  const { queue, nextAppointment } = data;

  return (
    <>
      <PageHeader
        title="Live queue"
        description={nextAppointment?.practiceLocation.location.clinic.name}
      />

      <Card className="mb-4 border-teal-200 bg-teal-50/60">
        <CardBody className="pt-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700">Your token</p>
          <p className="tnum mt-1 text-[52px] font-bold leading-none text-ink">
            #{String(queue.myToken).padStart(3, '0')}
          </p>
          <p className="mt-3 text-[13px] text-ink-2">
            Now serving{' '}
            <span className="tnum font-bold">
              {queue.currentToken ? `#${String(queue.currentToken).padStart(3, '0')}` : '—'}
            </span>
          </p>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardBody className="pt-4 text-center">
            <p className="tnum text-[28px] font-bold leading-none text-ink">{queue.ahead}</p>
            <p className="mt-1.5 text-[12px] text-muted">
              {queue.ahead === 1 ? 'patient ahead' : 'patients ahead'}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-4 text-center">
            <p className="tnum text-[28px] font-bold leading-none text-ink">
              {formatDuration(queue.etaMinutes)}
            </p>
            <p className="mt-1.5 text-[12px] text-muted">estimated wait</p>
          </CardBody>
        </Card>
      </div>

      {nextAppointment ? (
        <Card className="mt-4">
          <CardBody className="space-y-2 pt-4">
            <Row label="Doctor" value={nextAppointment.doctor.user.fullName} />
            <Row label="Clinic" value={nextAppointment.practiceLocation.location.name} />
            <Row label="Scheduled" value={formatTime(nextAppointment.scheduledStart)} />
          </CardBody>
        </Card>
      ) : null}

      <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-muted">
        <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Waiting times are an estimate based on how long consultations are taking today.
        Please stay near the clinic once you are next.
      </p>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
      <span className="text-[12.5px] text-muted">{label}</span>
      <span className="truncate text-[12.5px] font-semibold text-ink">{value}</span>
    </div>
  );
}
