import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Onboarding' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="mr-leads"
      title="Onboarding"
      basePath="/mr/(shell)/onboarding"
      searchParams={await searchParams}
      description="Leads moving through verification and activation"
    />
  );
}
