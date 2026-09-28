import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle, CheckCircle2, ClipboardList, Package, PackageCheck, Truck,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { StatusPill, humanise, toneForStatus } from '@/components/ui/status-pill';
import { Avatar } from '@/components/ui/avatar';
import { PageHeader } from '@/components/shell/page-header';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { serverFetch } from '@/lib/server-session';
import { ageFrom, formatCurrency, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Pharmacy Dashboard' };

interface Data {
  pharmacy: { id: string; name: string };
  kpis: {
    newOrders: number; preparing: number; ready: number; outForDelivery: number;
    completed: number; newToday: number; lowStock: number; expiringSoon: number;
  };
  recentOrders: {
    id: string; code: string; status: string; fulfilmentMode: string;
    sentAt: string; totalAmount: string | null;
    patient: { id: string; fullName: string; dateOfBirth: string | null; approxAgeYears: number | null };
    _count: { items: number };
  }[];
}

export default async function PharmacyDashboard() {
  let data: Data;
  try {
    data = await serverFetch<Data>('/dashboard/pharmacy');
  } catch {
    return <ErrorState title="We could not load the pharmacy dashboard" />;
  }

  const { kpis } = data;

  return (
    <>
      <PageHeader
        title={data.pharmacy.name}
        description="Prescription orders, inventory and delivery"
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New orders" value={kpis.newOrders} icon={Package} tone="cyan" href="/pharmacy/orders?status=SENT" actionLabel="Review" />
        <StatCard label="Preparing" value={kpis.preparing} icon={ClipboardList} tone="amber" href="/pharmacy/orders?status=PREPARING" />
        <StatCard label="Ready for pickup" value={kpis.ready} icon={PackageCheck} tone="teal" href="/pharmacy/orders?status=READY" />
        <StatCard label="Out for delivery" value={kpis.outForDelivery} icon={Truck} tone="violet" href="/pharmacy/delivery" />
      </section>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Received today" value={kpis.newToday} icon={Package} tone="navy" />
        <StatCard label="Completed" value={kpis.completed} icon={CheckCircle2} tone="green" href="/pharmacy/orders?status=COMPLETED" />
        <StatCard label="Low stock items" value={kpis.lowStock} icon={AlertTriangle} tone="red" href="/pharmacy/inventory" actionLabel="Restock" />
        <StatCard label="Expiring in 90 days" value={kpis.expiringSoon} icon={AlertTriangle} tone="amber" href="/pharmacy/inventory" />
      </section>

      <Card>
        <CardHeader
          title="Recent orders"
          description="Newest first"
          action={
            <Link href="/pharmacy/orders" className="text-[12px] font-semibold text-teal-700 hover:underline">
              View all
            </Link>
          }
        />
        {data.recentOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Prescription orders sent to this pharmacy will appear here."
            className="pb-8"
          />
        ) : (
          <ul className="divide-y divide-line">
            {data.recentOrders.map((order) => (
              <li key={order.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={order.patient.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{order.patient.fullName}</p>
                  <p className="tnum truncate text-[11px] text-muted">
                    {order.code} · {order._count.items} items ·{' '}
                    {ageFrom(order.patient.dateOfBirth, order.patient.approxAgeYears)}
                  </p>
                </div>
                <span className="tnum hidden shrink-0 text-[12px] text-muted sm:block">
                  {formatDate(order.sentAt)}
                </span>
                {order.totalAmount ? (
                  <span className="tnum hidden shrink-0 text-[13px] font-semibold text-ink md:block">
                    {formatCurrency(Number(order.totalAmount))}
                  </span>
                ) : null}
                <StatusPill tone={toneForStatus(order.status)}>{humanise(order.status)}</StatusPill>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
