import Link from 'next/link';
import { MessageSquare, ShieldAlert } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/shell/page-header';
import { EmptyState } from '@/components/ui/states';
import { serverFetch } from '@/lib/server-session';
import { formatDate } from '@/lib/utils';

interface Conversation {
  id: string;
  subject: string | null;
  lastMessageAt: string | null;
  doctor: { user: { fullName: string } } | null;
  patient: { fullName: string } | null;
  messages: { body: string | null; createdAt: string }[];
}

/**
 * Conversation list. Threads exist only where a treating relationship does, so
 * an empty list here is a correct outcome, not a failure.
 */
export async function MessagesPage({ basePath }: { basePath: string }) {
  let conversations: Conversation[] = [];
  try {
    const res = await serverFetch<{ rows: Conversation[] }>('/messages/conversations');
    conversations = res.rows;
  } catch {
    conversations = [];
  }

  const isPatient = basePath === '/patient';

  return (
    <>
      <PageHeader
        title="Messages"
        description={isPatient ? 'Talk to the doctors treating you' : 'Conversations with your patients'}
      />

      <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-danger-soft px-3.5 py-3">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
        <p className="text-[12.5px] leading-relaxed text-danger">
          This chat is not for medical emergencies. Please contact emergency services
          or visit the nearest emergency facility.
        </p>
      </div>

      <Card>
        <CardHeader title="Conversations" description={`${conversations.length} threads`} />
        {conversations.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            description={
              isPatient
                ? 'A thread opens once you have consulted with a doctor.'
                : 'Threads appear here once you have treated a patient who messages you.'
            }
            className="py-12"
          />
        ) : (
          <ul className="divide-y divide-line">
            {conversations.map((c) => {
              const name = isPatient
                ? (c.doctor?.user.fullName ?? 'Clinic')
                : (c.patient?.fullName ?? 'Patient');
              const preview = c.messages[0]?.body ?? 'No messages yet';
              return (
                <li key={c.id}>
                  <Link
                    href={`${basePath}/messages/${c.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-canvas"
                  >
                    <Avatar name={name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-ink">{name}</p>
                      <p className="truncate text-[12px] text-muted">{preview}</p>
                    </div>
                    {c.lastMessageAt ? (
                      <span className="tnum shrink-0 text-[11px] text-muted">
                        {formatDate(c.lastMessageAt)}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
