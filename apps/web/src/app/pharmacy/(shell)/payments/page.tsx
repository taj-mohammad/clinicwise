import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Payments' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="pharmacy-orders"
      title="Payments"
      description="Order values and settlement status"
      basePath="/pharmacy/payments"
      searchParams={await searchParams}
    />
  );
}
