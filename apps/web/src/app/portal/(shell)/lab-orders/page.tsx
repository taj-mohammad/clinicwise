import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Lab Orders' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="lab-orders"
      title="Lab Orders"
      basePath="/portal/(shell)/lab-orders"
      searchParams={await searchParams}
      filters={[{"key": "status", "label": "status", "options": [{"value": "ORDERED", "label": "Ordered"}, {"value": "SAMPLE_COLLECTED", "label": "Sample Collected"}, {"value": "PROCESSING", "label": "Processing"}, {"value": "REPORT_READY", "label": "Report Ready"}, {"value": "DELIVERED", "label": "Delivered"}]}]}
    />
  );
}
