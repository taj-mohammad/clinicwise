import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Orders' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="pharmacy-orders"
      title="Orders"
      basePath="/pharmacy/(shell)/orders"
      searchParams={await searchParams}
      filters={[{"key": "status", "label": "status", "options": [{"value": "SENT", "label": "Sent"}, {"value": "ACCEPTED", "label": "Accepted"}, {"value": "PREPARING", "label": "Preparing"}, {"value": "READY", "label": "Ready"}, {"value": "OUT_FOR_DELIVERY", "label": "Out For Delivery"}, {"value": "COMPLETED", "label": "Completed"}]}]}
    />
  );
}
