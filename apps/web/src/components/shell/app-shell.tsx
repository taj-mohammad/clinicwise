'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Sidebar } from './sidebar';
import { Topbar, type TopbarProps } from './topbar';
import { CommandPalette } from './command-palette';
import { NAV_SETS, type NavKey } from './nav-config';

const COLLAPSE_KEY = 'cliniqx:sidebar-collapsed';

export interface AppShellProps {
  /** Selects the navigation set; a key, not icon components, crosses from the server. */
  nav: NavKey;
  children: React.ReactNode;
  badges?: Partial<Record<string, number>>;
  contextSwitcher?: TopbarProps['contextSwitcher'];
  quickCreate?: TopbarProps['quickCreate'];
  counts?: TopbarProps['counts'];
}

export function AppShell({
  nav, children, badges, contextSwitcher, quickCreate, counts,
}: AppShellProps) {
  const sections = NAV_SETS[nav];
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Restore the collapse preference after hydration so the markup stays stable.
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* storage can be unavailable in private windows; the default is fine */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="flex min-h-dvh bg-canvas">
      <aside className="sticky top-0 hidden h-dvh shrink-0 lg:block">
        <Sidebar
          sections={sections}
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          badges={badges}
        />
      </aside>

      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-navy-900/50 lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[272px] outline-none lg:hidden">
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <Dialog.Close
              aria-label="Close navigation"
              className="absolute right-3 top-4 z-10 grid size-8 place-items-center rounded-lg text-navy-300 hover:bg-navy-800 hover:text-white"
            >
              <X className="size-4" aria-hidden />
            </Dialog.Close>
            <Sidebar
              sections={sections}
              collapsed={false}
              onToggle={() => undefined}
              badges={badges}
              variant="drawer"
              onNavigate={() => setDrawerOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOpenSidebar={() => setDrawerOpen(true)}
          onOpenCommand={() => setCommandOpen(true)}
          contextSwitcher={contextSwitcher}
          quickCreate={quickCreate}
          counts={counts}
        />
        <main className="flex-1 px-4 pb-10 pt-5 lg:px-6">{children}</main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
