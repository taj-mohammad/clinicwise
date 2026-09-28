import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { LoginForm } from '@/components/auth/login-form';
import { getSession } from '@/lib/server-session';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  // Someone already signed in should never see a login form.
  const session = await getSession();
  if (session) redirect('/lab');

  return (
    <AuthLayout
      eyebrow="Lab Partner"
      title="Lab partner sign-in"
      subtitle="Manage test orders, samples and reports."
    >
      <LoginForm
        portal="lab"
        redirectTo="/lab"
        allowPassword={true}
        allowOtp={true}
        defaultMode="password"
      />
    </AuthLayout>
  );
}
