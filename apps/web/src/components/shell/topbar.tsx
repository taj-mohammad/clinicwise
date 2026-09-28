'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell, ChevronDown, HelpCircle, LogOut, Menu, MessageSquare, Plus, Search, Settings, User,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/use-session';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface TopbarProps {
  onOpenSidebar: () => void;
  onOpenCommand: () => void;
  /** Clinic or location switcher, supplied by the portal that needs one. */
  contextSwitcher?: React.ReactNode;
  quickCreate?: { label: string; href: string }[];
  counts?: { notifications?: number; messages?: number };
}

export function Topbar({
  onOpenSidebar, onOpenCommand, contextSwitcher, quickCreate, counts,
}: TopbarProps) {
  const { user } = useSession();
  const router = useRouter();

  async function signOut() {
    await api.post('/auth/logout').catch(() => undefined);
    router.push('/portal/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur-sm lg:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
        className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-navy-100 lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* The search field is a button: typing happens in the command palette. */}
      <button
        type="button"
        onClick={onOpenCommand}
        className="group hidden h-9 flex-1 items-center gap-2.5 rounded-lg border border-line bg-canvas px-3 text-left text-[13px] text-navy-400 transition-colors hover:border-navy-200 hover:bg-white sm:flex lg:max-w-md"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate">Search patients, doctors, appointments…</span>
        <kbd className="hidden shrink-0 rounded border border-line bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-navy-400 lg:block">
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        onClick={onOpenCommand}
        aria-label="Search"
        className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-navy-100 sm:hidden"
      >
        <Search className="size-5" aria-hidden />
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        {contextSwitcher}

        {quickCreate?.length ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button size="sm" className="hidden md:inline-flex">
                <Plus className="size-4" aria-hidden />
                Create
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 min-w-52 rounded-xl border border-line bg-surface p-1.5 shadow-overlay"
              >
                {quickCreate.map((item) => (
                  <DropdownMenu.Item key={item.href} asChild>
                    <Link
                      href={item.href}
                      className="flex cursor-pointer items-center rounded-lg px-3 py-2 text-[13px] font-medium text-ink-2 outline-none data-[highlighted]:bg-navy-100 data-[highlighted]:text-ink"
                    >
                      {item.label}
                    </Link>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : null}

        <IconBadgeButton
          href="/portal/messages"
          label="Messages"
          icon={MessageSquare}
          count={counts?.messages}
        />
        <IconBadgeButton
          href="/portal/notifications"
          label="Notifications"
          icon={Bell}
          count={counts?.notifications}
        />
        <Link
          href="/help"
          aria-label="Help"
          className="hidden size-9 place-items-center rounded-lg text-ink-2 hover:bg-navy-100 lg:grid"
        >
          <HelpCircle className="size-[18px]" aria-hidden />
        </Link>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-navy-100"
            >
              <Avatar name={user.fullName} size="sm" />
              <span className="hidden min-w-0 text-left lg:block">
                <span className="block truncate text-[13px] font-semibold leading-tight text-ink">
                  {user.fullName}
                </span>
                <span className="block truncate text-[11px] leading-tight text-muted">
                  {user.primaryRoleLabel ?? user.roles[0]}
                </span>
              </span>
              <ChevronDown className="hidden size-4 text-navy-400 lg:block" aria-hidden />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-56 rounded-xl border border-line bg-surface p-1.5 shadow-overlay"
            >
              <div className="border-b border-line px-3 py-2.5">
                <p className="truncate text-[13px] font-semibold text-ink">{user.fullName}</p>
                <p className="truncate text-[11px] text-muted">{user.email ?? user.mobile}</p>
              </div>
              <DropdownMenu.Item asChild>
                <Link href="/portal/settings/profile" className={menuItemClass}>
                  <User className="size-4" aria-hidden /> My profile
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link href="/portal/settings" className={menuItemClass}>
                  <Settings className="size-4" aria-hidden /> Settings
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-line" />
              <DropdownMenu.Item
                onSelect={() => void signOut()}
                className={cn(menuItemClass, 'text-danger data-[highlighted]:bg-danger-soft data-[highlighted]:text-danger')}
              >
                <LogOut className="size-4" aria-hidden /> Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}

const menuItemClass =
  'flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-2 outline-none data-[highlighted]:bg-navy-100 data-[highlighted]:text-ink';

function IconBadgeButton({
  href, label, icon: Icon, count,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}) {
  return (
    <Link
      href={href}
      aria-label={count ? `${label}, ${count} unread` : label}
      className="relative grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-navy-100"
    >
      <Icon className="size-[18px]" aria-hidden />
      {count ? (
        <span className="tnum absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white ring-2 ring-surface">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </Link>
  );
}
