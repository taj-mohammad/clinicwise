import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Blog' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="blogs"
      title="Blog"
      basePath="/portal/(shell)/blog"
      searchParams={await searchParams}
      filters={[{"key": "status", "label": "status", "options": [{"value": "PUBLISHED", "label": "Published"}, {"value": "DRAFT", "label": "Draft"}, {"value": "ARCHIVED", "label": "Archived"}]}]}
    />
  );
}
