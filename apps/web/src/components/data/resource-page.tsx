import Link from 'next/link';
import { Inbox, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { PageHeader } from '@/components/shell/page-header';
import { serverFetch } from '@/lib/server-session';
import { COLUMNS, type Column, type Row } from './columns';
import { formatNumber } from '@/lib/utils';

interface ListResponse {
  rows: Row[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ResourcePageProps {
  /** API resource name; also selects the column set. */
  resource: string;
  title: string;
  description?: string;
  /** Base path used when building pagination and filter links. */
  basePath: string;
  searchParams: Record<string, string | undefined>;
  actions?: React.ReactNode;
  /** Filter chips rendered above the table. */
  filters?: { key: string; label: string; options: { value: string; label: string }[] }[];
  emptyTitle?: string;
  emptyDescription?: string;
  /** Extra query parameters always applied, e.g. a fixed status. */
  fixedQuery?: Record<string, string>;
  columnsOverride?: Column[];
}

/**
 * Renders any registry-backed resource as a searchable, filterable, paged list.
 * All data comes from the API under the caller's own permissions.
 */
export async function ResourcePage({
  resource, title, description, basePath, searchParams, actions,
  filters, emptyTitle, emptyDescription, fixedQuery, columnsOverride,
}: ResourcePageProps) {
  const columns = columnsOverride ?? COLUMNS[resource] ?? [];

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...fixedQuery, ...searchParams })) {
    if (value) query.set(key, value);
  }
  if (!query.has('pageSize')) query.set('pageSize', '20');

  let data: ListResponse;
  try {
    data = await serverFetch<ListResponse>(`/resources/${resource}?${query.toString()}`);
  } catch {
    return (
      <>
        <PageHeader title={title} description={description} actions={actions} />
        <Card>
          <ErrorState
            title="We could not load this list"
            description="You may not have access to these records, or the service is temporarily unavailable."
          />
        </Card>
      </>
    );
  }

  const activeSearch = searchParams.q ?? '';

  function linkWith(patch: Record<string, string | undefined>): string {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...searchParams, ...patch })) {
      if (v) next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <>
      <PageHeader
        title={title}
        description={
          description ??
          `${formatNumber(data.total)} ${data.total === 1 ? 'record' : 'records'}`
        }
        actions={actions}
      />

      {/* Search and filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form action={basePath} className="relative flex-1 sm:max-w-xs">
          {Object.entries(searchParams).map(([k, v]) =>
            k !== 'q' && k !== 'page' && v ? <input key={k} type="hidden" name={k} value={v} /> : null,
          )}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-navy-300" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={activeSearch}
            placeholder="Search…"
            aria-label={`Search ${title.toLowerCase()}`}
            className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-navy-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/15"
          />
        </form>

        {filters?.map((filter) => (
          <div key={filter.key} className="flex flex-wrap items-center gap-1">
            <Link
              href={linkWith({ [filter.key]: undefined, page: undefined })}
              className={chipClass(!searchParams[filter.key])}
            >
              All {filter.label.toLowerCase()}
            </Link>
            {filter.options.map((option) => (
              <Link
                key={option.value}
                href={linkWith({ [filter.key]: option.value, page: undefined })}
                className={chipClass(searchParams[filter.key] === option.value)}
              >
                {option.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <Card className="overflow-hidden">
        {data.rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={emptyTitle ?? `No ${title.toLowerCase()} yet`}
            description={
              activeSearch
                ? `Nothing matched “${activeSearch}”. Try a different search.`
                : (emptyDescription ?? 'Records will appear here once they exist.')
            }
            className="py-14"
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line bg-canvas text-left">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        scope="col"
                        className="whitespace-nowrap px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-navy-400"
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.rows.map((row, i) => (
                    <tr key={String(row.id ?? i)} className="transition-colors hover:bg-canvas">
                      {columns.map((col) => (
                        <td key={col.key} className={`px-5 py-3 align-middle ${col.className ?? ''}`}>
                          {col.cell(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards — a horizontally scrolling table is unusable on a phone. */}
            <ul className="divide-y divide-line lg:hidden">
              {data.rows.map((row, i) => {
                const primary = columns.find((c) => c.primary) ?? columns[0]!;
                const rest = columns.filter((c) => c !== primary && !c.hideOnMobile);
                return (
                  <li key={String(row.id ?? i)} className="px-4 py-3">
                    <div className="mb-2">{primary.cell(row)}</div>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {rest.map((col) => (
                        <div key={col.key} className="min-w-0">
                          <dt className="text-[10px] font-bold uppercase tracking-wide text-navy-400">
                            {col.header}
                          </dt>
                          <dd className="mt-0.5 min-w-0">{col.cell(row)}</dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {data.totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
            <p className="tnum text-[12px] text-muted">
              Page {data.page} of {data.totalPages} · {formatNumber(data.total)} total
            </p>
            <div className="flex gap-1.5">
              <PageLink
                href={linkWith({ page: String(data.page - 1) })}
                disabled={data.page <= 1}
                label="Previous"
              />
              <PageLink
                href={linkWith({ page: String(data.page + 1) })}
                disabled={data.page >= data.totalPages}
                label="Next"
              />
            </div>
          </div>
        ) : null}
      </Card>
    </>
  );
}

function chipClass(active: boolean): string {
  return active
    ? 'rounded-full bg-navy-900 px-3 py-1.5 text-[12px] font-semibold text-white'
    : 'rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink-2 hover:bg-navy-50';
}

function PageLink({ href, disabled, label }: { href: string; disabled: boolean; label: string }) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold text-navy-300">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink-2 hover:bg-navy-50"
    >
      {label}
    </Link>
  );
}
