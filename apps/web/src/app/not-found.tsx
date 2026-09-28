import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-5 text-center">
      <Logo tone="dark" />
      <span className="mt-8 grid size-14 place-items-center rounded-2xl bg-navy-100 text-navy-400">
        <Compass className="size-7" aria-hidden />
      </span>
      <h1 className="mt-4 text-[24px] font-bold tracking-tight text-ink">
        We could not find that page
      </h1>
      <p className="mt-1.5 max-w-sm text-[14px] text-muted">
        The link may be out of date, or the record may have been moved. Your sign-in
        is still active.
      </p>
      <div className="mt-6 flex gap-2.5">
        <Button asChild>
          <Link href="/">Go to my dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/help">Get help</Link>
        </Button>
      </div>
    </div>
  );
}
