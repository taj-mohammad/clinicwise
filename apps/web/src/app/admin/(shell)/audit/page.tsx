import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Audit Logs' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="audit-logs"
      title="Audit Logs"
      basePath="/admin/audit"
      searchParams={await searchParams}
      description="Every recorded action, newest first"
    />
  );
}
