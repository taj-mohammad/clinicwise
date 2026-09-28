import { cn, initials } from '@/lib/utils';

const SIZES = {
  xs: 'size-7 text-[10px]',
  sm: 'size-9 text-[11px]',
  md: 'size-10 text-xs',
  lg: 'size-12 text-sm',
  xl: 'size-16 text-lg',
} as const;

/**
 * Initials avatar with a hue derived from the name, so the same person keeps
 * the same colour across every screen without storing anything.
 */
export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const palette = [
    'bg-teal-100 text-teal-800', 'bg-cyan-100 text-cyan-700',
    'bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-800',
    'bg-rose-100 text-rose-700', 'bg-navy-200 text-navy-800',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const hue = palette[hash % palette.length]!;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={cn('shrink-0 rounded-full object-cover ring-2 ring-white', SIZES[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-bold ring-2 ring-white',
        SIZES[size], hue, className,
      )}
    >
      {initials(name)}
    </span>
  );
}
