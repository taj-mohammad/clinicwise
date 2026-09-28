'use client';

import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-teal-600 text-white shadow-sm hover:bg-teal-700 active:bg-teal-800 disabled:bg-navy-200 disabled:text-navy-400',
  secondary:
    'bg-navy-900 text-white shadow-sm hover:bg-navy-800 active:bg-navy-900 disabled:bg-navy-200 disabled:text-navy-400',
  outline:
    'border border-line bg-surface text-ink-2 hover:bg-navy-50 hover:text-ink active:bg-navy-100 disabled:text-navy-300',
  ghost: 'text-ink-2 hover:bg-navy-100 hover:text-ink active:bg-navy-200 disabled:text-navy-300',
  danger: 'bg-danger text-white shadow-sm hover:bg-red-700 active:bg-red-800 disabled:bg-navy-200',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-[15px]',
  icon: 'h-9 w-9 rounded-lg',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, asChild, children, disabled, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      // `loading` already implies the action is in flight, so the control is inert.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold transition-colors',
        'disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {/* Slot needs exactly one child, so `asChild` passes the child through untouched. */}
      {asChild ? (
        children
      ) : (
        <>
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {children}
        </>
      )}
    </Comp>
  );
});
