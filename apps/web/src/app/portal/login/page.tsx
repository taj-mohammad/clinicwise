import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { LoginForm } from '@/components/auth/login-form';
import { getSession } from '@/lib/server-session';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  // Someone already signed in should never see a login form.
  const session = await getSession();
  if (session) redirect('/portal');

  return (
    <AuthLayout
      eyebrow="Clinic Portal"
      title="Sign in to your clinic"
      subtitle="Doctors, reception, nursing, accounts and management."
    >
      <LoginForm
        portal="portal"
        redirectTo="/portal"
        allowPassword={true}
        allowOtp={true}
        defaultMode="password"
      />
    </AuthLayout>
  );
}
