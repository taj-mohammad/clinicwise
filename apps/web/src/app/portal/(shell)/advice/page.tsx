import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Quick Advice' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="advice-templates"
      title="Quick Advice"
      basePath="/portal/(shell)/advice"
      searchParams={await searchParams}
    />
  );
}
