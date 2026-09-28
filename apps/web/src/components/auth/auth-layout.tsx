import Link from 'next/link';
import { Activity, Check, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/brand/logo';

const ASSURANCES = [
  'Role-based access on every record',
  'Private medical documents with signed, expiring links',
  'Every clinical access written to an audit trail',
];

/**
 * Split-screen authentication layout. The marketing panel collapses away on
 * small screens so the form is the only thing competing for attention.
 */
export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-navy-900 p-12 lg:flex lg:flex-col">
        <div
          aria-hidden
          className="absolute -left-24 -top-24 size-[420px] rounded-full bg-teal-600/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -right-16 size-[380px] rounded-full bg-cyan-500/15 blur-3xl"
        />

        <Link href="/" className="relative z-10 w-fit">
          <Logo />
        </Link>

        <div className="relative z-10 mt-auto max-w-md">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-teal-400">
            Smart Clinic. Connected Care.
          </p>
          <h2 className="mt-3 text-[34px] font-bold leading-[1.15] tracking-tight text-white">
            One connected operating system for your clinic.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-navy-300">
            Appointments, live queue, consultations, prescriptions, labs, pharmacy
            and records — in one place, for every location you practise at.
          </p>

          <ul className="mt-8 space-y-3">
            {ASSURANCES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[14px] text-navy-200">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-teal-600/20 text-teal-400">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mt-12 flex items-center gap-2 text-[12px] text-navy-400">
          <ShieldCheck className="size-4" aria-hidden />
          Powered by Intigus Pharmaceutical Private Limited
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center bg-canvas px-5 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <Logo tone="dark" />
          </div>

          <div className="mt-8 lg:mt-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-teal-700 ring-1 ring-inset ring-teal-200">
              <Activity className="size-3" aria-hidden />
              {eyebrow}
            </span>
            <h1 className="mt-3.5 text-[26px] font-bold tracking-tight text-ink">{title}</h1>
            <p className="mt-1.5 text-[14px] text-muted">{subtitle}</p>
          </div>

          <div className="mt-7">{children}</div>

          {footer ? <div className="mt-6">{footer}</div> : null}

          <p className="mt-10 text-center text-[11px] leading-relaxed text-navy-400">
            This is a medical records system. Access is monitored and audited.
            <br />
            Not for medical emergencies — contact emergency services instead.
          </p>
        </div>
      </div>
    </div>
  );
}
