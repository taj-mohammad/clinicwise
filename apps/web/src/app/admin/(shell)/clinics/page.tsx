import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Clinics' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="clinics"
      title="Clinics"
      basePath="/admin/clinics"
      searchParams={await searchParams}
      filters={[{"key": "status", "label": "status", "options": [{"value": "ACTIVE", "label": "Active"}, {"value": "PENDING", "label": "Pending"}, {"value": "SUSPENDED", "label": "Suspended"}]}]}
    />
  );
}
