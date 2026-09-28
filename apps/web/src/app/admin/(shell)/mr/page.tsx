import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'MR Network' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="mr-leads"
      title="MR Network"
      basePath="/admin/mr"
      searchParams={await searchParams}
    />
  );
}
