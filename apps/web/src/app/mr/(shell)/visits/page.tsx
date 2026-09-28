import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Visits' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="mr-visits"
      title="Visits"
      basePath="/mr/(shell)/visits"
      searchParams={await searchParams}
    />
  );
}
