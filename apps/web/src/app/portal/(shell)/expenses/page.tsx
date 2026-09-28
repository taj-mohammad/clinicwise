import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Expenses' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="expenses"
      title="Expenses"
      basePath="/portal/(shell)/expenses"
      searchParams={await searchParams}
      filters={[{"key": "status", "label": "status", "options": [{"value": "APPROVED", "label": "Approved"}, {"value": "SUBMITTED", "label": "Submitted"}, {"value": "PAID", "label": "Paid"}, {"value": "DRAFT", "label": "Draft"}]}]}
    />
  );
}
