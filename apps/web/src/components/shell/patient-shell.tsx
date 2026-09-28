'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Logo } from '@/components/brand/logo';
import { PATIENT_TABS } from './nav-config';
import { useSession } from '@/hooks/use-session';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * The patient experience is a mobile app first: a compact header, a single
 * scrolling column, and a thumb-reachable bottom bar that stays put.
 */
export function PatientShell({
  children,
  badges,
}: {
  children: React.ReactNode;
  badges?: Partial<Record<string, number>>;
}) {
  const pathname = usePathname();
  const { user } = useSession();
  const router = useRouter();

  async function signOut() {
    await api.post('/auth/logout').catch(() => undefined);
    router.push('/patient/login');
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-canvas shadow-card sm:border-x sm:border-line">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur-sm">
        <Link href="/patient" aria-label="CliniqX home">
          <Logo tone="dark" />
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/patient/notifications"
            aria-label="Notifications"
            className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-navy-100"
          >
            <Bell className="size-[18px]" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label="Sign out"
            className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-navy-100"
          >
            <LogOut className="size-[18px]" aria-hidden />
          </button>
          <Link href="/patient/profile" aria-label="Your profile" className="ml-1">
            <Avatar name={user.fullName} size="sm" />
          </Link>
        </div>
      </header>

      {/* Bottom padding clears the fixed tab bar. */}
      <main id="main" className="flex-1 px-4 pb-28 pt-4">
        {children}
      </main>

      <nav
        aria-label="Patient sections"
        className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl border-t border-line bg-surface/97 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
      >
        <ul className="grid grid-cols-5">
          {PATIENT_TABS.map((tab) => {
            const active =
              tab.href === '/patient'
                ? pathname === '/patient'
                : pathname.startsWith(tab.href);
            const badge = tab.badgeKey ? badges?.[tab.badgeKey] : undefined;
            const Icon = tab.icon;

            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold transition-colors',
                    active ? 'text-teal-700' : 'text-navy-400',
                  )}
                >
                  <span className="relative">
                    <Icon className="size-[21px]" aria-hidden strokeWidth={active ? 2.4 : 2} />
                    {badge ? (
                      <span className="tnum absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white ring-2 ring-surface">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    ) : null}
                  </span>
                  {tab.label}
                  {active ? (
                    <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-teal-600" aria-hidden />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
