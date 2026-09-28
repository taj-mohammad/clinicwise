'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Building2, Check, ChevronDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PracticeLocation {
  id: string;
  name: string;
  city: string | null;
  clinicName: string;
}

/**
 * Switches the dashboard between the doctor's practice locations. The choice
 * lives in the URL so a reloaded or shared link opens the same location, and
 * the server re-checks that the doctor actually practises there.
 */
export function LocationSwitcher({
  locations,
  selectedId,
}: {
  locations: PracticeLocation[];
  selectedId: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();

  if (locations.length <= 1) {
    const only = locations[0];
    if (!only) return null;
    return (
      <span className="hidden items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-1.5 text-[13px] font-medium text-ink-2 md:inline-flex">
        <MapPin className="size-3.5 text-teal-600" aria-hidden />
        <span className="max-w-44 truncate">{only.clinicName}</span>
      </span>
    );
  }

  const selected = locations.find((l) => l.id === selectedId);

  function select(id: string | null) {
    const next = new URLSearchParams(params.toString());
    if (id) next.set('locationId', id);
    else next.delete('locationId');
    router.push(`?${next.toString()}`);
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-navy-50"
        >
          <MapPin className="size-3.5 shrink-0 text-teal-600" aria-hidden />
          <span className="max-w-32 truncate sm:max-w-44">
            {selected ? selected.clinicName : 'All locations'}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-navy-400" aria-hidden />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-overlay"
        >
          <DropdownMenu.Label className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-navy-400">
            Practice locations
          </DropdownMenu.Label>

          <DropdownMenu.Item onSelect={() => select(null)} className={itemClass}>
            <Building2 className="size-4 shrink-0 text-navy-400" aria-hidden />
            <span className="flex-1">All locations</span>
            {!selectedId ? <Check className="size-4 text-teal-600" aria-hidden /> : null}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-line" />

          {locations.map((loc) => (
            <DropdownMenu.Item key={loc.id} onSelect={() => select(loc.id)} className={itemClass}>
              <MapPin className="size-4 shrink-0 text-navy-400" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{loc.clinicName}</span>
                {loc.city ? <span className="block truncate text-[11px] text-muted">{loc.city}</span> : null}
              </span>
              {selectedId === loc.id ? <Check className="size-4 shrink-0 text-teal-600" aria-hidden /> : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

const itemClass = cn(
  'flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-ink-2 outline-none',
  'data-[highlighted]:bg-navy-100 data-[highlighted]:text-ink',
);
