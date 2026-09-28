import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Prescriptions' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="pharmacy-orders"
      title="Prescriptions"
      basePath="/pharmacy/(shell)/prescriptions"
      searchParams={await searchParams}
      description="Prescriptions sent to this pharmacy"
    />
  );
}
