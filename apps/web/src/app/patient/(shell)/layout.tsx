import { redirect } from 'next/navigation';
import { PatientShell } from '@/components/shell/patient-shell';
import { SessionProvider } from '@/hooks/use-session';
import { getSession } from '@/lib/server-session';

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/patient/login');

  return (
    <SessionProvider user={session}>
      <PatientShell>{children}</PatientShell>
    </SessionProvider>
  );
}
