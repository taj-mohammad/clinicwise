'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowRight, KeyRound, Mail, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError, api } from '@/lib/api';
import { cn } from '@/lib/utils';

export type Portal = 'admin' | 'portal' | 'patient' | 'mr' | 'pharmacy' | 'lab';

const passwordSchema = z.object({
  identifier: z.string().min(3, 'Enter your email or mobile number'),
  password: z.string().min(1, 'Enter your password'),
  rememberDevice: z.boolean().optional(),
});
type PasswordValues = z.infer<typeof passwordSchema>;

const mobileSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
});
type MobileValues = z.infer<typeof mobileSchema>;

export function LoginForm({
  portal,
  redirectTo,
  allowPassword = true,
  allowOtp = true,
  defaultMode = 'password',
}: {
  portal: Portal;
  redirectTo: string;
  allowPassword?: boolean;
  allowOtp?: boolean;
  defaultMode?: 'password' | 'otp';
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'password' | 'otp'>(defaultMode);
  const [formError, setFormError] = useState<string | null>(null);

  function onSuccess() {
    // A full refresh re-reads the new auth cookie on the server.
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div>
      {allowPassword && allowOtp ? (
        <div
          role="tablist"
          aria-label="Sign-in method"
          className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-navy-100 p-1"
        >
          <ModeTab
            active={mode === 'password'}
            onClick={() => { setMode('password'); setFormError(null); }}
            icon={KeyRound}
            label="Password"
          />
          <ModeTab
            active={mode === 'otp'}
            onClick={() => { setMode('otp'); setFormError(null); }}
            icon={Smartphone}
            label="Mobile OTP"
          />
        </div>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-danger-soft px-3.5 py-3"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <p className="text-[13px] font-medium text-danger">{formError}</p>
        </div>
      ) : null}

      {mode === 'password' ? (
        <PasswordMode portal={portal} onError={setFormError} onSuccess={onSuccess} />
      ) : (
        <OtpMode portal={portal} onError={setFormError} onSuccess={onSuccess} />
      )}
    </div>
  );
}

function ModeTab({
  active, onClick, icon: Icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-semibold transition-colors',
        active ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink-2',
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </button>
  );
}

function PasswordMode({
  portal, onError, onSuccess,
}: {
  portal: Portal;
  onError: (msg: string | null) => void;
  onSuccess: () => void;
}) {
  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  async function submit(values: PasswordValues) {
    onError(null);
    try {
      await api.post('/auth/login', { portal, ...values });
      onSuccess();
    } catch (err) {
      onError(
        err instanceof ApiError ? err.message : 'We could not sign you in. Please try again.',
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <Input
        label="Email or mobile"
        placeholder="you@clinic.in"
        icon={Mail}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        error={errors.identifier?.message}
        {...register('identifier')}
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-2">
          <input
            type="checkbox"
            className="size-4 rounded border-line text-teal-600 focus:ring-teal-600/25"
            {...register('rememberDevice')}
          />
          Remember this device
        </label>
        <a href="/forgot-password" className="text-[13px] font-semibold text-teal-700 hover:underline">
          Forgot password?
        </a>
      </div>

      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Sign in
        {!isSubmitting ? <ArrowRight className="size-4" aria-hidden /> : null}
      </Button>
    </form>
  );
}

function OtpMode({
  portal, onError, onSuccess,
}: {
  portal: Portal;
  onError: (msg: string | null) => void;
  onSuccess: () => void;
}) {
  const [stage, setStage] = useState<'mobile' | 'code'>('mobile');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const {
    register, handleSubmit, formState: { errors },
  } = useForm<MobileValues>({ resolver: zodResolver(mobileSchema) });

  async function requestCode(values: MobileValues) {
    onError(null);
    setBusy(true);
    try {
      const res = await api.post<{ expiresInSeconds: number; devCode?: string }>(
        '/auth/otp/request',
        { portal, mobile: values.mobile },
      );
      setMobile(values.mobile);
      setStage('code');
      // Development convenience only; the API omits this outside development.
      setHint(res.devCode ? `Development code: ${res.devCode}` : null);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'We could not send the code.');
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    onError(null);
    setBusy(true);
    try {
      await api.post('/auth/otp/verify', { portal, mobile, code });
      onSuccess();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'That code did not work.');
    } finally {
      setBusy(false);
    }
  }

  if (stage === 'mobile') {
    return (
      <form onSubmit={handleSubmit(requestCode)} className="space-y-4" noValidate>
        <Input
          label="Mobile number"
          prefix="+91"
          inputMode="numeric"
          maxLength={10}
          placeholder="98765 43210"
          autoComplete="tel-national"
          error={errors.mobile?.message}
          hint="We will send a 6-digit code to this number."
          {...register('mobile')}
        />
        <Button type="submit" size="lg" loading={busy} className="w-full">
          Send code
          {!busy ? <ArrowRight className="size-4" aria-hidden /> : null}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <div>
        <Input
          label="Enter the 6-digit code"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="tnum text-center text-lg font-semibold tracking-[0.4em]"
          hint={hint ?? `Sent to +91 ${mobile}`}
        />
      </div>
      <Button type="submit" size="lg" loading={busy} disabled={code.length !== 6} className="w-full">
        Verify and sign in
      </Button>
      <button
        type="button"
        onClick={() => { setStage('mobile'); setCode(''); onError(null); }}
        className="w-full text-center text-[13px] font-semibold text-teal-700 hover:underline"
      >
        Use a different number
      </button>
    </form>
  );
}
