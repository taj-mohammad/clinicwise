import Link from 'next/link';
import { Clock, Play, SkipForward, UserRound, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/states';
import { StatusPill } from '@/components/ui/status-pill';
import { ageFrom, formatDuration } from '@/lib/utils';

export interface QueuePatient {
  id: string;
  fullName: string;
  gender: string;
  dateOfBirth: string | null;
  approxAgeYears: number | null;
}

export interface QueueEntry {
  id: string;
  tokenNumber: number;
  status: string;
  position: number;
  joinedAt: string;
  patient: QueuePatient;
}

export interface QueueData {
  currentToken: number | null;
  avgConsultMin: number;
  nowConsulting: QueueEntry | null;
  waiting: QueueEntry[];
  waitingCount: number;
}

function describe(patient: QueuePatient): string {
  const age = ageFrom(patient.dateOfBirth, patient.approxAgeYears);
  const gender = patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase();
  return `${age} · ${gender}`;
}

/**
 * The live queue as the doctor sees it: who is in the room now, who is next,
 * and how long the rest have been waiting.
 */
export function QueueBoard({ queue }: { queue: QueueData }) {
  const [next, ...rest] = queue.waiting;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Live Queue"
        description={
          queue.waitingCount > 0
            ? `${queue.waitingCount} waiting · about ${formatDuration(queue.waitingCount * queue.avgConsultMin)} to clear`
            : 'No one is waiting right now'
        }
        action={
          <Link
            href="/portal/queue"
            className="text-[12px] font-semibold text-teal-700 hover:underline"
          >
            Manage
          </Link>
        }
      />

      <div className="flex-1 px-5 pb-5">
        {queue.nowConsulting ? (
          <div className="animate-pulse-ring rounded-xl border border-teal-200 bg-teal-50/70 p-3.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-teal-700">
                <span className="size-1.5 rounded-full bg-teal-600" aria-hidden />
                Now consulting
              </span>
              <span className="tnum text-[11px] font-semibold text-teal-700">
                Token #{String(queue.nowConsulting.tokenNumber).padStart(3, '0')}
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <Avatar name={queue.nowConsulting.patient.fullName} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-ink">
                  {queue.nowConsulting.patient.fullName}
                </p>
                <p className="text-[12px] text-teal-800/70">{describe(queue.nowConsulting.patient)}</p>
              </div>
              <Button size="sm" asChild>
                <Link href={`/portal/consultations/new?queueEntryId=${queue.nowConsulting.id}`}>
                  Open
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-canvas p-4 text-center">
            <p className="text-[13px] font-medium text-muted">No consultation in progress</p>
            {next ? (
              <Button size="sm" className="mt-2.5" asChild>
                <Link href="/portal/queue">
                  <Play className="size-3.5" aria-hidden />
                  Call token #{String(next.tokenNumber).padStart(3, '0')}
                </Link>
              </Button>
            ) : null}
          </div>
        )}

        {next ? (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-navy-400">
              Next patient
            </p>
            <QueueRow entry={next} highlight />
          </div>
        ) : null}

        {rest.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-navy-400">
              Waiting ({rest.length})
            </p>
            <ul className="space-y-1.5">
              {rest.slice(0, 4).map((entry) => (
                <li key={entry.id}>
                  <QueueRow entry={entry} />
                </li>
              ))}
            </ul>
            {rest.length > 4 ? (
              <Link
                href="/portal/queue"
                className="mt-2.5 block text-center text-[12px] font-semibold text-teal-700 hover:underline"
              >
                View all {queue.waitingCount} waiting
              </Link>
            ) : null}
          </div>
        ) : null}

        {!queue.nowConsulting && queue.waiting.length === 0 ? (
          <EmptyState
            icon={Users}
            title="The queue is clear"
            description="Patients appear here as reception checks them in."
            className="py-6"
          />
        ) : null}
      </div>
    </Card>
  );
}

function QueueRow({ entry, highlight }: { entry: QueueEntry; highlight?: boolean }) {
  const waitedMin = Math.max(
    0,
    Math.round((Date.now() - new Date(entry.joinedAt).getTime()) / 60_000),
  );

  return (
    <div
      className={
        highlight
          ? 'flex items-center gap-3 rounded-lg border border-line bg-canvas px-3 py-2.5'
          : 'flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-canvas'
      }
    >
      <span className="tnum grid size-9 shrink-0 place-items-center rounded-lg bg-navy-900 text-[12px] font-bold text-white">
        {String(entry.tokenNumber).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink">{entry.patient.fullName}</p>
        <p className="text-[11px] text-muted">{describe(entry.patient)}</p>
      </div>
      <span className="tnum inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted">
        <Clock className="size-3" aria-hidden />
        {waitedMin}m
      </span>
    </div>
  );
}
