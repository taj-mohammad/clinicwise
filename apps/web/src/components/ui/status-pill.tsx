import { cn } from '@/lib/utils';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'active';

const TONES: Record<Tone, string> = {
  neutral: 'bg-navy-100 text-navy-600 ring-navy-200',
  info: 'bg-cyan-50 text-cyan-600 ring-cyan-200',
  success: 'bg-success-soft text-success ring-green-200',
  warning: 'bg-warning-soft text-amber-700 ring-amber-200',
  danger: 'bg-danger-soft text-danger ring-red-200',
  active: 'bg-teal-50 text-teal-700 ring-teal-200',
};

/**
 * Status is never carried by colour alone: the label is always present, and a
 * dot marks the live state for readers who cannot distinguish the hues.
 */
export function StatusPill({
  tone = 'neutral',
  children,
  dot,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

/** Maps domain statuses onto the pill vocabulary in one place. */
export function toneForStatus(status: string): Tone {
  switch (status) {
    case 'COMPLETED':
    case 'PAID':
    case 'SUCCESS':
    case 'DELIVERED':
    case 'REPORT_READY':
    case 'PRESENT':
    case 'APPROVED':
    case 'ACTIVE':
      return 'success';
    case 'IN_CONSULTATION':
    case 'CALLED':
      return 'active';
    case 'WAITING':
    case 'PENDING':
    case 'PAYMENT_PENDING':
    case 'PROCESSING':
    case 'LATE':
    case 'IN_REVIEW':
      return 'warning';
    case 'CANCELLED':
    case 'NO_SHOW':
    case 'FAILED':
    case 'ABSENT':
    case 'REJECTED':
      return 'danger';
    case 'CONFIRMED':
    case 'CHECKED_IN':
    case 'SCHEDULED':
      return 'info';
    default:
      return 'neutral';
  }
}

/** "IN_CONSULTATION" reads as "In Consultation". */
export function humanise(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
