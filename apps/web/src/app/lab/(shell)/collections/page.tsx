import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Sample Collection' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="lab-orders"
      title="Sample Collection"
      basePath="/lab/(shell)/collections"
      searchParams={await searchParams}
      description="Samples collected and awaiting processing"
      fixedQuery={{"status": "SAMPLE_COLLECTED"}}
    />
  );
}
