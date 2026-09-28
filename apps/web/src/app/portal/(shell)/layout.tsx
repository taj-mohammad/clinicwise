import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { SessionProvider } from '@/hooks/use-session';
import { getSession } from '@/lib/server-session';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/portal/login');

  const isDoctor = session.roles.includes('DOCTOR');

  return (
    <SessionProvider user={session}>
      <AppShell
        nav={isDoctor ? 'doctor' : 'clinic-admin'}
        quickCreate={[
          { label: 'New patient', href: '/portal/patients/new' },
          { label: 'Book appointment', href: '/portal/appointments/new' },
          { label: 'Add walk-in', href: '/portal/walk-in' },
        ]}
      >
        <div id="main">{children}</div>
      </AppShell>
    </SessionProvider>
  );
}
