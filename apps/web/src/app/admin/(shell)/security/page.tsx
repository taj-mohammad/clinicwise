import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Security Events' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="security-events"
      title="Security Events"
      basePath="/admin/security"
      searchParams={await searchParams}
      filters={[{"key": "severity", "label": "severity", "options": [{"value": "critical", "label": "Critical"}, {"value": "warning", "label": "Warning"}, {"value": "info", "label": "Info"}]}]}
    />
  );
}
