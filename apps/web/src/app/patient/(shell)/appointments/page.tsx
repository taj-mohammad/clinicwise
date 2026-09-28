import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'My Appointments' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="appointments"
      title="My Appointments"
      description="Your upcoming and past visits"
      basePath="/patient/appointments"
      searchParams={await searchParams}
    />
  );
}
