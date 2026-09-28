import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { SessionProvider } from '@/hooks/use-session';
import { getSession } from '@/lib/server-session';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/mr/login');

  return (
    <SessionProvider user={session}>
      <AppShell nav="mr">
        <div id="main">{children}</div>
      </AppShell>
    </SessionProvider>
  );
}
