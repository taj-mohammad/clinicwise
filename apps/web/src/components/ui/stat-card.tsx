import Link from 'next/link';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatTone = 'teal' | 'cyan' | 'navy' | 'amber' | 'green' | 'red' | 'violet';

const ICON_TONES: Record<StatTone, string> = {
  teal: 'bg-teal-50 text-teal-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  navy: 'bg-navy-100 text-navy-700',
  amber: 'bg-warning-soft text-amber-600',
  green: 'bg-success-soft text-success',
  red: 'bg-danger-soft text-danger',
  violet: 'bg-violet-50 text-violet-600',
};

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: StatTone;
  /** Percentage or absolute change against the comparison period. */
  delta?: { value: string; direction: 'up' | 'down'; label?: string };
  /** Every meaningful number should lead somewhere. */
  href?: string;
  actionLabel?: string;
  className?: string;
}

export function StatCard({
  label, value, icon: Icon, tone = 'teal', delta, href, actionLabel, className,
}: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start gap-3.5">
        <span className={cn('grid size-11 shrink-0 place-items-center rounded-xl', ICON_TONES[tone])}>
          <Icon className="size-5" aria-hidden strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="tnum text-[26px] font-bold leading-none tracking-tight text-ink">{value}</p>
          <p className="mt-1.5 truncate text-[13px] font-medium text-muted">{label}</p>
        </div>
      </div>

      {delta || href ? (
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-line pt-3">
          {delta ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[12px] font-semibold',
                delta.direction === 'up' ? 'text-success' : 'text-danger',
              )}
            >
              {delta.direction === 'up' ? (
                <TrendingUp className="size-3.5" aria-hidden />
              ) : (
                <TrendingDown className="size-3.5" aria-hidden />
              )}
              {delta.value}
              {delta.label ? <span className="font-medium text-muted">{delta.label}</span> : null}
            </span>
          ) : (
            <span />
          )}
          {href ? (
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-teal-700 group-hover:gap-1.5 transition-all">
              {actionLabel ?? 'View'}
              <ArrowRight className="size-3.5" aria-hidden />
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );

  const base =
    'group block rounded-card border border-line bg-surface p-4 shadow-card transition-shadow';

  if (!href) return <div className={cn(base, className)}>{body}</div>;

  return (
    <Link href={href} className={cn(base, 'hover:shadow-raised', className)}>
      {body}
    </Link>
  );
}
