import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Payroll' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="payroll"
      title="Payroll"
      basePath="/portal/(shell)/payroll"
      searchParams={await searchParams}
      filters={[{"key": "status", "label": "status", "options": [{"value": "PAID", "label": "Paid"}, {"value": "APPROVED", "label": "Approved"}, {"value": "DRAFT", "label": "Draft"}]}]}
    />
  );
}
