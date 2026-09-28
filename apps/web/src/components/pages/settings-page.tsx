import Link from 'next/link';
import { Bell, Building2, CreditCard, KeyRound, Monitor, Shield, User } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/status-pill';
import { PageHeader } from '@/components/shell/page-header';
import { getSession } from '@/lib/server-session';

/**
 * Settings hub. Shows the live account context rather than a static form, so
 * what the reader sees always reflects the session they are actually in.
 */
export async function SettingsPage({ portal }: { portal: string }) {
  const session = await getSession();
  if (!session) return null;

  return (
    <>
      <PageHeader title="Settings" description="Your account, security and preferences" />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account" description="Read from your active session" />
          <CardBody className="space-y-2.5">
            <Row label="Name" value={session.fullName} />
            <Row label="Email" value={session.email ?? 'Not set'} />
            <Row label="Mobile" value={session.mobile ?? 'Not set'} />
            <Row label="Organisation" value={session.organizationName ?? 'Platform'} />
            <Row label="Account type" value={session.principalType} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Roles & access"
            description="Granted by your administrator and enforced server-side"
          />
          <CardBody>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {session.roles.map((role) => (
                <StatusPill key={role} tone="active">{role.replace(/_/g, ' ')}</StatusPill>
              ))}
            </div>
            <Row label="Effective permissions" value={String(session.permissions.length)} />
            <Row label="Clinics you can reach" value={String(session.clinicIds.length || '—')} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Security" description="Protect your account" />
          <CardBody className="space-y-1.5">
            <ActionRow icon={KeyRound} label="Change password" href={`${portal}/settings/password`} />
            <ActionRow icon={Monitor} label="Active sessions and devices" href={`${portal}/settings/sessions`} />
            <ActionRow icon={Shield} label="Two-factor authentication" href={`${portal}/settings/mfa`} badge="Not enabled" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Preferences" />
          <CardBody className="space-y-1.5">
            <ActionRow icon={Bell} label="Notification preferences" href={`${portal}/settings/notifications`} />
            <ActionRow icon={User} label="Profile details" href={`${portal}/settings/profile`} />
            {portal === '/portal' ? (
              <>
                <ActionRow icon={Building2} label="Clinic settings" href="/portal/settings/clinic" />
                <ActionRow icon={CreditCard} label="Billing preferences" href="/portal/settings/billing" />
              </>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <p className="mt-6 text-[12px] leading-relaxed text-muted">
        Access to patient records is audited. Your administrator can see when records
        were opened, by whom and from where.
      </p>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
      <span className="shrink-0 text-[12.5px] text-muted">{label}</span>
      <span className="truncate text-[12.5px] font-semibold text-ink">{value}</span>
    </div>
  );
}

function ActionRow({
  icon: Icon, label, href, badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-canvas hover:text-ink"
    >
      <Icon className="size-4 shrink-0 text-navy-400" aria-hidden />
      <span className="flex-1">{label}</span>
      {badge ? <StatusPill tone="neutral">{badge}</StatusPill> : null}
      <span className="text-navy-300" aria-hidden>›</span>
    </Link>
  );
}
