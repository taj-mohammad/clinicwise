import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CalendarPlus, ClipboardList, Clock, FileText, FlaskConical, HeartPulse,
  MapPin, MessageSquare, Search, Stethoscope, Wallet,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusPill, humanise, toneForStatus } from '@/components/ui/status-pill';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { serverFetch } from '@/lib/server-session';
import { ageFrom, formatCurrency, formatDate, formatDuration, formatTime, greeting } from '@/lib/utils';

export const metadata: Metadata = { title: 'Home' };

interface Data {
  patient: {
    id: string; code: string; fullName: string; gender: string;
    dateOfBirth: string | null; approxAgeYears: number | null;
    bloodGroup: string; allergies: string[]; chronicConditions: string[];
  };
  nextAppointment: {
    id: string; code: string; status: string; type: string; scheduledStart: string;
    tokenNumber: number | null; isPaid: boolean; fee: string;
    doctor: { id: string; user: { fullName: string }; specialties: { specialty: { name: string } }[] };
    practiceLocation: { location: { id: string; name: string; city: string | null; clinic: { name: string } } };
  } | null;
  queue: { currentToken: number | null; myToken: number | null; ahead: number; etaMinutes: number } | null;
  counts: {
    prescriptions: number; labReports: number; documents: number;
    unreadMessages: number; consultations: number;
    outstandingAmount: number; outstandingCount: number;
  };
  doctors: { id: string; name: string; specialty: string | null; lastVisitAt: string | null; visitCount: number }[];
  recentRecords: {
    id: string; code: string; startedAt: string; chiefComplaint: string | null;
    doctor: { user: { fullName: string } };
    diagnoses: { label: string }[];
  }[];
}

export default async function PatientHome() {
  let data: Data;
  try {
    data = await serverFetch<Data>('/dashboard/patient');
  } catch {
    return <ErrorState title="We could not load your health summary" />;
  }

  const { patient, nextAppointment, queue, counts } = data;
  const firstName = patient.fullName.split(' ')[0];

  return (
    <>
      <div className="mb-4">
        <p className="text-[13px] text-muted">{greeting()}</p>
        <h1 className="text-[22px] font-bold tracking-tight text-ink">Hi {firstName} 👋</h1>
        <p className="mt-0.5 text-[13px] text-muted">Take care of your health</p>
      </div>

      {/* Next appointment */}
      {nextAppointment ? (
        <Card className="mb-4 overflow-hidden border-teal-200">
          <div className="flex items-center justify-between bg-teal-50 px-4 py-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-teal-700">
              Next appointment
            </span>
            <StatusPill tone={toneForStatus(nextAppointment.status)}>
              {humanise(nextAppointment.status)}
            </StatusPill>
          </div>
          <CardBody className="pt-3.5">
            <div className="flex items-center gap-3">
              <Avatar name={nextAppointment.doctor.user.fullName} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-ink">
                  {nextAppointment.doctor.user.fullName}
                </p>
                <p className="truncate text-[12.5px] text-muted">
                  {nextAppointment.doctor.specialties[0]?.specialty.name ?? 'Consultation'}
                </p>
              </div>
            </div>

            <dl className="mt-3.5 space-y-1.5 border-t border-line pt-3">
              <Row
                icon={Clock}
                text={`${formatDate(nextAppointment.scheduledStart)} · ${formatTime(nextAppointment.scheduledStart)}`}
              />
              <Row
                icon={MapPin}
                text={[
                  nextAppointment.practiceLocation.location.clinic.name,
                  nextAppointment.practiceLocation.location.city,
                ].filter(Boolean).join(', ')}
              />
              {nextAppointment.tokenNumber ? (
                <Row icon={ClipboardList} text={`Token #${String(nextAppointment.tokenNumber).padStart(3, '0')}`} />
              ) : null}
            </dl>

            {!nextAppointment.isPaid ? (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-warning-soft px-3 py-2">
                <span className="text-[12px] font-semibold text-amber-700">
                  {formatCurrency(Number(nextAppointment.fee))} payable at the clinic
                </span>
              </div>
            ) : null}

            <div className="mt-3.5 grid grid-cols-2 gap-2">
              <Button size="sm" asChild>
                <Link href="/patient/queue">View queue</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/patient/appointments/${nextAppointment.id}`}>Details</Link>
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="mb-4">
          <EmptyState
            icon={CalendarPlus}
            title="No upcoming appointment"
            description="Find a doctor and book a visit when you need one."
            action={
              <Button size="sm" asChild>
                <Link href="/patient/doctors">Find a doctor</Link>
              </Button>
            }
            className="py-8"
          />
        </Card>
      )}

      {/* Live queue */}
      {queue?.myToken ? (
        <Card className="mb-4 border-cyan-200 bg-cyan-50/50">
          <CardBody className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-700">
                  Live queue
                </p>
                <p className="tnum mt-1 text-[26px] font-bold leading-none text-ink">
                  #{String(queue.myToken).padStart(3, '0')}
                </p>
                <p className="mt-1 text-[12px] text-muted">Your token</p>
              </div>
              <div className="text-right">
                <p className="tnum text-[20px] font-bold text-cyan-700">
                  {queue.currentToken ? `#${String(queue.currentToken).padStart(3, '0')}` : '—'}
                </p>
                <p className="mt-1 text-[12px] text-muted">Now serving</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-cyan-200 pt-2.5 text-[12.5px]">
              <span className="font-semibold text-ink-2">
                {queue.ahead} {queue.ahead === 1 ? 'patient' : 'patients'} ahead
              </span>
              <span className="text-muted">about {formatDuration(queue.etaMinutes)}</span>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {/* Quick access */}
      <section className="mb-4">
        <h2 className="mb-2.5 text-[13px] font-bold text-ink">Quick access</h2>
        <div className="grid grid-cols-4 gap-2.5">
          <Tile href="/patient/doctors" icon={Search} label="Find doctor" tone="cyan" />
          <Tile href="/patient/appointments/new" icon={CalendarPlus} label="Book visit" tone="teal" />
          <Tile href="/patient/records" icon={FileText} label="My records" tone="violet" />
          <Tile href="/patient/messages" icon={MessageSquare} label="Messages" tone="amber" badge={counts.unreadMessages} />
        </div>
      </section>

      {/* My health */}
      <section className="mb-4">
        <h2 className="mb-2.5 text-[13px] font-bold text-ink">My health records</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <RecordTile href="/patient/records?kind=prescriptions" icon={FileText} label="Prescriptions" count={counts.prescriptions} tone="teal" />
          <RecordTile href="/patient/records?kind=labs" icon={FlaskConical} label="Lab reports" count={counts.labReports} tone="cyan" />
          <RecordTile href="/patient/records" icon={Stethoscope} label="Consultations" count={counts.consultations} tone="violet" />
          <RecordTile href="/patient/payments" icon={Wallet} label="Payments" count={counts.outstandingCount} tone="amber" />
        </div>
      </section>

      {/* Health profile */}
      <Card className="mb-4">
        <CardHeader title="Health profile" description={`Patient ID ${patient.code}`} />
        <CardBody className="space-y-2">
          <ProfileRow label="Age" value={ageFrom(patient.dateOfBirth, patient.approxAgeYears)} />
          <ProfileRow label="Gender" value={humanise(patient.gender)} />
          <ProfileRow label="Blood group" value={patient.bloodGroup === 'UNKNOWN' ? 'Not recorded' : patient.bloodGroup.replace('_POS', '+').replace('_NEG', '−')} />
          <ProfileRow
            label="Allergies"
            value={patient.allergies.length ? patient.allergies.join(', ') : 'None recorded'}
            alert={patient.allergies.length > 0}
          />
          {patient.chronicConditions.length ? (
            <ProfileRow label="Conditions" value={patient.chronicConditions.join(', ')} />
          ) : null}
        </CardBody>
      </Card>

      {/* My doctors */}
      {data.doctors.length > 0 ? (
        <Card className="mb-4">
          <CardHeader title="My doctors" />
          <ul className="divide-y divide-line">
            {data.doctors.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 px-5 py-2.5">
                <Avatar name={doc.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{doc.name}</p>
                  <p className="truncate text-[11px] text-muted">
                    {doc.specialty ?? 'Consultation'} · {doc.visitCount} {doc.visitCount === 1 ? 'visit' : 'visits'}
                  </p>
                </div>
                <Link
                  href={`/patient/messages?doctorId=${doc.id}`}
                  aria-label={`Message ${doc.name}`}
                  className="grid size-8 place-items-center rounded-lg text-teal-700 hover:bg-teal-50"
                >
                  <MessageSquare className="size-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* Recent visits */}
      {data.recentRecords.length > 0 ? (
        <Card>
          <CardHeader title="Recent visits" />
          <ul className="divide-y divide-line">
            {data.recentRecords.map((rec) => (
              <li key={rec.id} className="px-5 py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-[13px] font-semibold text-ink">
                    {rec.diagnoses[0]?.label ?? rec.chiefComplaint ?? 'Consultation'}
                  </p>
                  <span className="tnum shrink-0 text-[11px] text-muted">{formatDate(rec.startedAt)}</span>
                </div>
                <p className="truncate text-[11.5px] text-muted">{rec.doctor.user.fullName}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <p className="mt-6 rounded-lg bg-danger-soft px-3.5 py-2.5 text-[11.5px] leading-relaxed text-danger">
        <HeartPulse className="mr-1.5 inline size-3.5" aria-hidden />
        This app is not for medical emergencies. Contact emergency services or go to
        the nearest emergency facility.
      </p>
    </>
  );
}

function Row({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-center gap-2 text-[12.5px] text-ink-2">
      <Icon className="size-3.5 shrink-0 text-navy-400" aria-hidden />
      <span className="truncate">{text}</span>
    </div>
  );
}

const TILE_TONES = {
  teal: 'bg-teal-50 text-teal-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-warning-soft text-amber-600',
} as const;

function Tile({
  href, icon: Icon, label, tone, badge,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: keyof typeof TILE_TONES;
  badge?: number;
}) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1.5 text-center">
      <span className={`relative grid size-14 place-items-center rounded-2xl ${TILE_TONES[tone]}`}>
        <Icon className="size-[22px]" aria-hidden />
        {badge ? (
          <span className="tnum absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-canvas">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </span>
      <span className="text-[11px] font-semibold leading-tight text-ink-2">{label}</span>
    </Link>
  );
}

function RecordTile({
  href, icon: Icon, label, count, tone,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  tone: keyof typeof TILE_TONES;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 transition-shadow hover:shadow-card"
    >
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${TILE_TONES[tone]}`}>
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] font-semibold text-ink">{label}</span>
        <span className="tnum block text-[11px] text-muted">{count} records</span>
      </span>
    </Link>
  );
}

function ProfileRow({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
      <span className="shrink-0 text-[12.5px] text-muted">{label}</span>
      <span className={`truncate text-[12.5px] font-semibold ${alert ? 'text-danger' : 'text-ink'}`}>
        {value}
      </span>
    </div>
  );
}
