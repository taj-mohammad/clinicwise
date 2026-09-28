import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { LoginForm } from '@/components/auth/login-form';
import { getSession } from '@/lib/server-session';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  // Someone already signed in should never see a login form.
  const session = await getSession();
  if (session) redirect('/admin');

  return (
    <AuthLayout
      eyebrow="Administration"
      title="CliniqX administration"
      subtitle="Platform and organisation-level control."
    >
      <LoginForm
        portal="admin"
        redirectTo="/admin"
        allowPassword={true}
        allowOtp={false}
        defaultMode="password"
      />
    </AuthLayout>
  );
}
