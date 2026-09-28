import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { LoginForm } from '@/components/auth/login-form';
import { getSession } from '@/lib/server-session';

export const metadata: Metadata = { title: 'Sign in' };

export default async function PatientLoginPage() {
  const session = await getSession();
  if (session) redirect('/patient');

  return (
    <AuthLayout
      eyebrow="Patient"
      title="Sign in to CliniqX"
      subtitle="Use the mobile number registered at your clinic."
    >
      {/* Patients sign in with a one-time code — no password to remember or leak. */}
      <LoginForm portal="patient" redirectTo="/patient" allowPassword={false} defaultMode="otp" />
    </AuthLayout>
  );
}
