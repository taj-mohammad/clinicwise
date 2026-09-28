import { cn } from '@/lib/utils';

/**
 * CliniqX mark: a rounded square holding a stylised pulse trace. Drawn inline
 * so it stays crisp at every size and needs no network request.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} role="img" aria-label="CliniqX">
      <defs>
        <linearGradient id="cx-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#cx-mark)" />
      <path
        d="M6 17.5h4.2l2.1-4.8 2.9 8.6 2.4-6.1 1.7 2.3H26"
        fill="none"
        stroke="white"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  compact,
  tone = 'light',
}: {
  className?: string;
  compact?: boolean;
  tone?: 'light' | 'dark';
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      {compact ? null : (
        <span
          className={cn(
            'text-[17px] font-bold tracking-tight',
            tone === 'light' ? 'text-white' : 'text-ink',
          )}
        >
          Cliniq<span className="text-teal-400">X</span>
        </span>
      )}
    </span>
  );
}
