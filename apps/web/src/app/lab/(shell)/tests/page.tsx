import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Test Catalog' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="lab-tests"
      title="Test Catalog"
      basePath="/lab/(shell)/tests"
      searchParams={await searchParams}
    />
  );
}
