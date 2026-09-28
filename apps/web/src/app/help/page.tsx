import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, LifeBuoy, Mail, MessageSquare, Phone, ShieldCheck } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Logo } from '@/components/brand/logo';

export const metadata: Metadata = { title: 'Help & Support' };

const TOPICS = [
  { icon: BookOpen, title: 'Getting started', body: 'Registering patients, booking appointments and running your first OPD session.' },
  { icon: MessageSquare, title: 'Consultations & prescriptions', body: 'Recording a consultation, issuing a digital prescription and uploading a physical one.' },
  { icon: ShieldCheck, title: 'Access & permissions', body: 'Why you may not see a record, and how your administrator grants access.' },
  { icon: LifeBuoy, title: 'Queue & walk-ins', body: 'Issuing tokens, calling the next patient and handling no-shows.' },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/" className="inline-block">
        <Logo tone="dark" />
      </Link>

      <h1 className="mt-8 text-[28px] font-bold tracking-tight text-ink">Help & support</h1>
      <p className="mt-1.5 text-[14px] text-muted">
        Guidance for using CliniqX, and how to reach a person when you need one.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {TOPICS.map((topic) => (
          <Card key={topic.title} className="p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-600">
              <topic.icon className="size-5" aria-hidden />
            </span>
            <p className="mt-3 text-[14px] font-bold text-ink">{topic.title}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{topic.body}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-5">
        <CardHeader title="Contact support" description="Monday to Saturday, 9:00 to 19:00 IST" />
        <CardBody className="space-y-2.5">
          <a href="mailto:support@intigus.in" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-2 hover:bg-canvas">
            <Mail className="size-4 text-navy-400" aria-hidden />
            support@intigus.in
          </a>
          <a href="tel:+912240001000" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-2 hover:bg-canvas">
            <Phone className="size-4 text-navy-400" aria-hidden />
            022 4000 1000
          </a>
        </CardBody>
      </Card>

      <div className="mt-6 rounded-lg border border-red-200 bg-danger-soft px-4 py-3">
        <p className="text-[13px] font-semibold text-danger">Medical emergencies</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-danger">
          CliniqX support cannot help with medical emergencies. Contact emergency
          services or go to the nearest emergency facility.
        </p>
      </div>

      <p className="mt-8 text-center text-[11.5px] text-muted">
        CliniqX · Powered by Intigus Pharmaceutical Private Limited
      </p>
    </div>
  );
}
