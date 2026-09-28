import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Organizations' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="organizations"
      title="Organizations"
      basePath="/admin/organizations"
      searchParams={await searchParams}
      filters={[{"key": "status", "label": "status", "options": [{"value": "ACTIVE", "label": "Active"}, {"value": "PENDING", "label": "Pending"}, {"value": "SUSPENDED", "label": "Suspended"}]}]}
    />
  );
}
