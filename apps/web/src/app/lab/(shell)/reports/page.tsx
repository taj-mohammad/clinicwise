import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Reports' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="lab-orders"
      title="Reports"
      basePath="/lab/(shell)/reports"
      searchParams={await searchParams}
      description="Completed reports ready to deliver"
      fixedQuery={{"status": "REPORT_READY"}}
    />
  );
}
