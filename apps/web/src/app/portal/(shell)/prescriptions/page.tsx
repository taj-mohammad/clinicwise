import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Prescriptions' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="prescriptions"
      title="Prescriptions"
      basePath="/portal/(shell)/prescriptions"
      searchParams={await searchParams}
      filters={[{"key": "status", "label": "status", "options": [{"value": "ISSUED", "label": "Issued"}, {"value": "DRAFT", "label": "Draft"}, {"value": "CANCELLED", "label": "Cancelled"}]}]}
    />
  );
}
