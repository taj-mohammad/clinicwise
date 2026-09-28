'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import {
  CalendarPlus, FileText, FlaskConical, Search, Settings, Stethoscope, UserPlus, Users,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/use-session';

interface SearchHit {
  type: 'patient' | 'doctor' | 'appointment' | 'prescription';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

const ACTIONS = [
  { label: 'Create patient', icon: UserPlus, href: '/portal/patients/new' },
  { label: 'Book appointment', icon: CalendarPlus, href: '/portal/appointments/new' },
  { label: 'Add walk-in', icon: Users, href: '/portal/walk-in' },
  { label: 'Start consultation', icon: Stethoscope, href: '/portal/queue' },
  { label: 'Create prescription', icon: FileText, href: '/portal/prescriptions/new' },
  { label: 'Order lab test', icon: FlaskConical, href: '/portal/lab-orders/new' },
  { label: 'Open settings', icon: Settings, href: '/portal/settings' },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { user } = useSession();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced server search. Results are permission-filtered by the API.
  useEffect(() => {
    if (!open) return;
    const term = query.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get<{ results: SearchHit[] }>(
          `/search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        );
        setHits(res.results);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-900/40 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-surface shadow-overlay"
          aria-label="Search and commands"
        >
          <Dialog.Title className="sr-only">Search CliniqX</Dialog.Title>
          <Command shouldFilter={false} loop>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-[18px] shrink-0 text-navy-300" aria-hidden />
              <Command.Input
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder="Search patients, doctors, appointments…"
                className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-navy-300"
              />
              <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold text-navy-400 sm:block">
                ESC
              </kbd>
            </div>

            <Command.List className="scrollbar-thin max-h-[52vh] overflow-y-auto p-2">
              {loading ? (
                <p className="px-3 py-6 text-center text-[13px] text-muted">Searching…</p>
              ) : null}

              {!loading && query.trim().length >= 2 && hits.length === 0 ? (
                <Command.Empty className="px-3 py-8 text-center text-[13px] text-muted">
                  Nothing matched “{query.trim()}”.
                </Command.Empty>
              ) : null}

              {hits.length > 0 ? (
                <Command.Group
                  heading="Results"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-navy-400"
                >
                  {hits.map((hit) => (
                    <Command.Item
                      key={`${hit.type}-${hit.id}`}
                      value={`${hit.type}-${hit.id}`}
                      onSelect={() => go(hit.href)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] outline-none data-[selected=true]:bg-navy-100"
                    >
                      <Avatar name={hit.title} size="xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-ink">{hit.title}</span>
                        {hit.subtitle ? (
                          <span className="block truncate text-[11px] text-muted">{hit.subtitle}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-navy-500">
                        {hit.type}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}

              {query.trim().length < 2 ? (
                <Command.Group
                  heading="Quick actions"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-navy-400"
                >
                  {ACTIONS.map((action) => (
                    <Command.Item
                      key={action.href}
                      value={action.label}
                      onSelect={() => go(action.href)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-2 outline-none data-[selected=true]:bg-navy-100 data-[selected=true]:text-ink"
                    >
                      <span className="grid size-7 place-items-center rounded-md bg-teal-50 text-teal-600">
                        <action.icon className="size-4" aria-hidden />
                      </span>
                      {action.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}
            </Command.List>
          </Command>

          <p className="border-t border-line bg-canvas px-4 py-2 text-[11px] text-muted">
            Results respect your permissions — you only see records you may open.
            {user.patientId ? ' Showing your own records.' : ''}
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
