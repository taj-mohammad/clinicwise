import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Consultations' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="consultations"
      title="Consultations"
      basePath="/admin/consultations"
      searchParams={await searchParams}
      filters={[{"key": "status", "label": "status", "options": [{"value": "COMPLETED", "label": "Completed"}, {"value": "IN_PROGRESS", "label": "In Progress"}, {"value": "DRAFT", "label": "Draft"}]}]}
    />
  );
}
