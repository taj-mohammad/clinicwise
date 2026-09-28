import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Doctors' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="doctors"
      title="Doctors"
      basePath="/admin/doctors"
      searchParams={await searchParams}
      filters={[{"key": "status", "label": "status", "options": [{"value": "ACTIVE", "label": "Active"}, {"value": "PENDING_VERIFICATION", "label": "Pending Verification"}, {"value": "INACTIVE", "label": "Inactive"}]}]}
    />
  );
}
