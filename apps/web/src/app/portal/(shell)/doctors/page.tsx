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
      basePath="/portal/(shell)/doctors"
      searchParams={await searchParams}
    />
  );
}
