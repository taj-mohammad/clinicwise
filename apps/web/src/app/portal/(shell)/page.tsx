import type { Metadata } from 'next';
import { ErrorState } from '@/components/ui/states';
import { getSession, serverFetch } from '@/lib/server-session';
import { DoctorDashboard, type DoctorDashboardData } from './doctor-dashboard';
import { ClinicDashboard, type ClinicDashboardData } from './clinic-dashboard';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function PortalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ locationId?: string; clinicId?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) return null;

  const isDoctor = session.roles.includes('DOCTOR');

  try {
    if (isDoctor) {
      const query = params.locationId ? `?locationId=${encodeURIComponent(params.locationId)}` : '';
      const data = await serverFetch<DoctorDashboardData>(`/dashboard/doctor${query}`);
      return <DoctorDashboard data={data} user={session} />;
    }

    const query = params.clinicId ? `?clinicId=${encodeURIComponent(params.clinicId)}` : '';
    const data = await serverFetch<ClinicDashboardData>(`/dashboard/clinic${query}`);
    return <ClinicDashboard data={data} user={session} />;
  } catch {
    return (
      <ErrorState
        title="We could not load your dashboard"
        description="The information could not be fetched just now. Reload the page to try again."
      />
    );
  }
}
