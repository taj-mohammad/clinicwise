import type { Metadata } from 'next';
import Link from 'next/link';
import { Beaker, ClipboardList, FileCheck2, FlaskConical, Home, TestTube } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { StatusPill, humanise, toneForStatus } from '@/components/ui/status-pill';
import { Avatar } from '@/components/ui/avatar';
import { PageHeader } from '@/components/shell/page-header';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { serverFetch } from '@/lib/server-session';
import { ageFrom, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Lab Dashboard' };

interface Data {
  lab: { id: string; name: string };
  kpis: {
    newOrders: number; collection: number; processing: number; reportsReady: number;
    delivered: number; newToday: number; homeCollections: number; testsOffered: number;
  };
  recentOrders: {
    id: string; code: string; status: string; homeCollection: boolean; orderedAt: string;
    patient: { id: string; fullName: string; dateOfBirth: string | null; approxAgeYears: number | null };
    doctor: { user: { fullName: string } };
    items: { testName: string }[];
  }[];
}

export default async function LabDashboard() {
  let data: Data;
  try {
    data = await serverFetch<Data>('/dashboard/lab');
  } catch {
    return <ErrorState title="We could not load the laboratory dashboard" />;
  }

  const { kpis } = data;

  return (
    <>
      <PageHeader title={data.lab.name} description="Test orders, samples and reports" />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New orders" value={kpis.newOrders} icon={ClipboardList} tone="cyan" href="/lab/orders?status=ORDERED" actionLabel="Accept" />
        <StatCard label="Sample collected" value={kpis.collection} icon={TestTube} tone="violet" href="/lab/collections" />
        <StatCard label="Processing" value={kpis.processing} icon={Beaker} tone="amber" href="/lab/orders?status=PROCESSING" />
        <StatCard label="Reports ready" value={kpis.reportsReady} icon={FileCheck2} tone="green" href="/lab/reports" actionLabel="Deliver" />
      </section>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Received today" value={kpis.newToday} icon={ClipboardList} tone="navy" />
        <StatCard label="Home collections due" value={kpis.homeCollections} icon={Home} tone="cyan" href="/lab/collections" />
        <StatCard label="Delivered" value={kpis.delivered} icon={FileCheck2} tone="green" href="/lab/orders?status=DELIVERED" />
        <StatCard label="Tests offered" value={kpis.testsOffered} icon={FlaskConical} tone="teal" href="/lab/tests" actionLabel="Catalog" />
      </section>

      <Card>
        <CardHeader
          title="Recent orders"
          action={
            <Link href="/lab/orders" className="text-[12px] font-semibold text-teal-700 hover:underline">
              View all
            </Link>
          }
        />
        {data.recentOrders.length === 0 ? (
          <EmptyState icon={FlaskConical} title="No test orders yet" className="pb-8" />
        ) : (
          <ul className="divide-y divide-line">
            {data.recentOrders.map((order) => (
              <li key={order.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={order.patient.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{order.patient.fullName}</p>
                  <p className="truncate text-[11px] text-muted">
                    {order.items.map((i) => i.testName).join(', ')} · ordered by {order.doctor.user.fullName}
                  </p>
                </div>
                {order.homeCollection ? (
                  <StatusPill tone="info" className="hidden sm:inline-flex">Home</StatusPill>
                ) : null}
                <span className="tnum hidden shrink-0 text-[12px] text-muted md:block">
                  {formatDate(order.orderedAt)}
                </span>
                <StatusPill tone={toneForStatus(order.status)}>{humanise(order.status)}</StatusPill>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
