import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Delivery' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="pharmacy-orders"
      title="Delivery"
      basePath="/pharmacy/(shell)/delivery"
      searchParams={await searchParams}
      description="Orders currently out for delivery"
      fixedQuery={{"status": "OUT_FOR_DELIVERY"}}
    />
  );
}
