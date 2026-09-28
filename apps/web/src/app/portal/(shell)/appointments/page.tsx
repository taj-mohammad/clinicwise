import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Appointments' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="appointments"
      title="Appointments"
      basePath="/portal/(shell)/appointments"
      searchParams={await searchParams}
      filters={[{"key": "status", "label": "status", "options": [{"value": "CONFIRMED", "label": "Confirmed"}, {"value": "WAITING", "label": "Waiting"}, {"value": "IN_CONSULTATION", "label": "In Consultation"}, {"value": "COMPLETED", "label": "Completed"}, {"value": "NO_SHOW", "label": "No Show"}, {"value": "CANCELLED", "label": "Cancelled"}]}]}
    />
  );
}
