import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Attendance' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="attendance"
      title="Attendance"
      basePath="/portal/(shell)/attendance"
      searchParams={await searchParams}
      filters={[{"key": "status", "label": "status", "options": [{"value": "PRESENT", "label": "Present"}, {"value": "LATE", "label": "Late"}, {"value": "ABSENT", "label": "Absent"}, {"value": "LEAVE", "label": "Leave"}]}]}
    />
  );
}
