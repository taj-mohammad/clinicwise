'use client';

import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { formatNumber } from '@/lib/utils';

/**
 * Chart palette. Two hues that stay distinguishable for the most common forms
 * of colour vision deficiency, and are never the sole carrier of meaning —
 * every series is labelled.
 */
const SERIES = {
  appointments: { label: 'Appointments', color: '#0EA5E9' },
  consultations: { label: 'Consultations', color: '#0D9488' },
};

export function TrendChart({
  data,
}: {
  data: { day: string; appointments: number; consultations: number }[];
}) {
  const points = data.map((d) => ({
    ...d,
    label: new Date(d.day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4">
        {Object.entries(SERIES).map(([key, s]) => (
          <span key={key} className="flex items-center gap-1.5 text-[12px] font-medium text-ink-2">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
            {s.label}
          </span>
        ))}
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <defs>
              {Object.entries(SERIES).map(([key, s]) => (
                <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={false}
              width={44}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: '#CBD5E1', strokeWidth: 1 }}
              contentStyle={{
                borderRadius: 12, border: '1px solid #E2E8F0',
                fontSize: 12, boxShadow: '0 12px 32px -8px rgb(15 23 42 / 0.18)',
              }}
            />
            {Object.entries(SERIES).map(([key, s]) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#fill-${key})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Horizontal bars rather than a pie: comparing lengths against a shared
 * baseline is far easier than comparing angles, and the labels stay readable.
 */
export function CityBars({ data }: { data: { city: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  if (data.length === 0) {
    return <p className="py-6 text-center text-[13px] text-muted">No patient locations recorded yet.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {data.map((row) => (
        <li key={row.city}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-[13px] font-medium text-ink-2">{row.city}</span>
            <span className="tnum shrink-0 text-[12px] font-semibold text-ink">
              {formatNumber(row.count)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-navy-100">
            <div
              className="h-full rounded-full bg-teal-600"
              style={{ width: `${(row.count / max) * 100}%` }}
              role="presentation"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
