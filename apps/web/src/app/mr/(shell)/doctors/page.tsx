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
      resource="mr-leads"
      title="Doctors"
      basePath="/mr/(shell)/doctors"
      searchParams={await searchParams}
      description="Doctors you have onboarded"
      fixedQuery={{"stage": "ACTIVATED"}}
    />
  );
}
