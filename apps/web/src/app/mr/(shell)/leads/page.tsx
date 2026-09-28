import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Leads' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="mr-leads"
      title="Leads"
      basePath="/mr/(shell)/leads"
      searchParams={await searchParams}
      filters={[{"key": "stage", "label": "stage", "options": [{"value": "LEAD", "label": "Lead"}, {"value": "CONTACTED", "label": "Contacted"}, {"value": "INTERESTED", "label": "Interested"}, {"value": "DEMO", "label": "Demo"}, {"value": "DOCUMENTS_PENDING", "label": "Documents Pending"}, {"value": "VERIFICATION", "label": "Verification"}, {"value": "APPROVED", "label": "Approved"}, {"value": "ACTIVATED", "label": "Activated"}]}]}
    />
  );
}
