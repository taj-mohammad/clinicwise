import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: "Today's OPD" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="appointments"
      title="Today&apos;s OPD"
      basePath="/portal/(shell)/opd"
      searchParams={await searchParams}
      description="Appointments scheduled for today"
    />
  );
}
