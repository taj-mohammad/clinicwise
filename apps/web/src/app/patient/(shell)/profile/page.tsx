import type { Metadata } from 'next';
import { SettingsPage } from '@/components/pages/settings-page';

export const metadata: Metadata = { title: 'Profile' };

export default function Page() {
  return <SettingsPage portal="/patient" />;
}
