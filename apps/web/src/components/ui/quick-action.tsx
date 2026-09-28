import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const TONES = {
  teal: 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white',
  cyan: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-500 group-hover:text-white',
  violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
  amber: 'bg-warning-soft text-amber-600 group-hover:bg-amber-500 group-hover:text-white',
  navy: 'bg-navy-100 text-navy-700 group-hover:bg-navy-900 group-hover:text-white',
  green: 'bg-success-soft text-success group-hover:bg-success group-hover:text-white',
} as const;

export function QuickAction({
  label, icon: Icon, href, onClick, tone = 'teal',
}: {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  tone?: keyof typeof TONES;
}) {
  const content = (
    <>
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg transition-colors', TONES[tone])}>
        <Icon className="size-[18px]" aria-hidden strokeWidth={2} />
      </span>
      <span className="text-left text-[13px] font-semibold leading-tight text-ink-2 group-hover:text-ink">
        {label}
      </span>
    </>
  );

  const base =
    'group flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-shadow hover:shadow-card';

  if (href) return <Link href={href} className={base}>{content}</Link>;
  return <button type="button" onClick={onClick} className={base}>{content}</button>;
}
