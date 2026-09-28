'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Logo, LogoMark } from '@/components/brand/logo';
import { cn } from '@/lib/utils';
import type { NavSection } from './nav-config';
import { useSession } from '@/hooks/use-session';

export interface SidebarProps {
  sections: NavSection[];
  collapsed: boolean;
  onToggle: () => void;
  badges?: Partial<Record<string, number>>;
  /** Rendered in the drawer on small screens, where collapsing makes no sense. */
  variant?: 'fixed' | 'drawer';
  onNavigate?: () => void;
}

export function Sidebar({
  sections, collapsed, onToggle, badges, variant = 'fixed', onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const { has } = useSession();
  const isDrawer = variant === 'drawer';
  const isCollapsed = collapsed && !isDrawer;

  return (
    <nav
      aria-label="Main"
      className={cn(
        'flex h-full flex-col bg-navy-900 text-navy-200 transition-[width] duration-200',
        isCollapsed ? 'w-[68px]' : 'w-[248px]',
      )}
    >
      <div className={cn('flex h-16 shrink-0 items-center px-4', isCollapsed && 'justify-center px-0')}>
        <Link href="/" onClick={onNavigate} className="rounded-lg">
          {isCollapsed ? <LogoMark /> : <Logo />}
        </Link>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4">
        {sections.map((section, i) => {
          const visible = section.items.filter((item) => !item.permission || has(item.permission));
          if (visible.length === 0) return null;

          return (
            <div key={section.title ?? i} className={cn(i > 0 && 'mt-5')}>
              {section.title && !isCollapsed ? (
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-navy-500">
                  {section.title}
                </p>
              ) : null}
              {section.title && isCollapsed ? (
                <div className="mx-3 mb-2 border-t border-navy-700" />
              ) : null}

              <ul className="space-y-0.5">
                {visible.map((item) => {
                  // Only the dashboard root matches exactly; sections match by prefix.
                  const isRoot = item.href.split('/').filter(Boolean).length === 1;
                  const active = isRoot
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const badge = item.badgeKey ? badges?.[item.badgeKey] : undefined;
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? 'page' : undefined}
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors',
                          active
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'text-navy-300 hover:bg-navy-800 hover:text-white',
                          isCollapsed && 'justify-center px-0',
                        )}
                      >
                        <Icon className="size-[18px] shrink-0" aria-hidden strokeWidth={active ? 2.3 : 2} />
                        {!isCollapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
                        {badge ? (
                          <span
                            className={cn(
                              'tnum grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold',
                              active ? 'bg-white text-teal-700' : 'bg-teal-600 text-white',
                              isCollapsed && 'absolute right-1.5 top-1 h-4 min-w-4 px-1 text-[9px]',
                            )}
                          >
                            {badge > 99 ? '99+' : badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {!isDrawer ? (
        <div className="shrink-0 border-t border-navy-800 p-3">
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-navy-400 transition-colors hover:bg-navy-800 hover:text-white',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? (
              <ChevronsRight className="size-[18px]" aria-hidden />
            ) : (
              <>
                <ChevronsLeft className="size-[18px]" aria-hidden />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      ) : null}
    </nav>
  );
}
