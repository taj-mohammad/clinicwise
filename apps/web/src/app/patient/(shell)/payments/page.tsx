import type { Metadata } from 'next';
import { ResourcePage } from '@/components/data/resource-page';

export const metadata: Metadata = { title: 'Payments' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ResourcePage
      resource="invoices"
      title="Payments"
      description="Your invoices and payment history"
      basePath="/patient/payments"
      searchParams={await searchParams}
    />
  );
}
