import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Find a Doctor' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="doctors"
      title="Find a Doctor"
      description="Search by name, specialty or clinic"
      basePath="/patient/doctors"
      searchParams={await searchParams}
    />
  );
}
