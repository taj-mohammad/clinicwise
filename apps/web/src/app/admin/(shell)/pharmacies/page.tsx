import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Pharmacies' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="pharmacies"
      title="Pharmacies"
      basePath="/admin/pharmacies"
      searchParams={await searchParams}
    />
  );
}
