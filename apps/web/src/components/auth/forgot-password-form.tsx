'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError, api } from '@/lib/api';

const schema = z.object({ email: z.string().email('Enter the email on your account') });
type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register, handleSubmit, getValues, formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function submit(values: Values) {
    setError(null);
    try {
      await api.post('/auth/password/forgot', values);
    } catch (err) {
      // A failure must not reveal whether the address exists.
      if (err instanceof ApiError && err.status >= 500) {
        setError('We could not send the code just now. Please try again.');
        return;
      }
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-green-200 bg-success-soft p-5 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-white text-success">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <p className="mt-3 text-[15px] font-bold text-ink">Check your email</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
          If an account exists for <span className="font-semibold">{getValues('email')}</span>,
          we have sent a verification code. The code expires in 5 minutes.
        </p>
        <p className="mt-3 text-[12px] text-muted">
          Didn’t get it? Check spam, or contact your clinic administrator.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-danger-soft px-3.5 py-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <p className="text-[13px] font-medium text-danger">{error}</p>
        </div>
      ) : null}

      <Input
        label="Email address"
        type="email"
        icon={Mail}
        placeholder="you@clinic.in"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Send verification code
        {!isSubmitting ? <ArrowRight className="size-4" aria-hidden /> : null}
      </Button>

      <p className="text-[12px] leading-relaxed text-muted">
        Patients sign in with a one-time code and do not need a password. If you are a
        patient, return to the sign-in page and use your mobile number.
      </p>
    </form>
  );
}
