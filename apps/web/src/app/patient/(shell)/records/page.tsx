import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'My Records' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="documents"
      title="My Records"
      description="Prescriptions, reports and documents"
      basePath="/patient/records"
      searchParams={await searchParams}
    />
  );
}
