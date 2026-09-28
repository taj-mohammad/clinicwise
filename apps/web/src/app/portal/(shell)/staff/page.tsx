import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Staff' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="staff"
      title="Staff"
      basePath="/portal/(shell)/staff"
      searchParams={await searchParams}
      filters={[{"key": "status", "label": "status", "options": [{"value": "ACTIVE", "label": "Active"}, {"value": "ON_LEAVE", "label": "On Leave"}, {"value": "INACTIVE", "label": "Inactive"}]}]}
    />
  );
}
