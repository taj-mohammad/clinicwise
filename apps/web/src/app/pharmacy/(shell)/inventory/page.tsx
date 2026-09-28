import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Inventory' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="pharmacy-inventory"
      title="Inventory"
      basePath="/pharmacy/(shell)/inventory"
      searchParams={await searchParams}
    />
  );
}
