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
      resource="payments"
      title="Payments"
      basePath="/portal/(shell)/payments"
      searchParams={await searchParams}
      filters={[{"key": "status", "label": "status", "options": [{"value": "SUCCESS", "label": "Success"}, {"value": "PENDING", "label": "Pending"}, {"value": "FAILED", "label": "Failed"}, {"value": "REFUNDED", "label": "Refunded"}]}]}
    />
  );
}
