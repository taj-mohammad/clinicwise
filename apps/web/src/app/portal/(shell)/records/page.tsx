import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Medical Records' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="documents"
      title="Medical Records"
      basePath="/portal/(shell)/records"
      searchParams={await searchParams}
    />
  );
}
