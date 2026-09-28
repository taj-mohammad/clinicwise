import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Diet Plans' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="diet-plans"
      title="Diet Plans"
      basePath="/portal/(shell)/diet-plans"
      searchParams={await searchParams}
      filters={[{"key": "status", "label": "status", "options": [{"value": "ACTIVE", "label": "Active"}, {"value": "APPROVED", "label": "Approved"}, {"value": "DRAFT", "label": "Draft"}, {"value": "IN_REVIEW", "label": "In Review"}]}]}
    />
  );
}
