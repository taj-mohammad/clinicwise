import type { Metadata } from 'next';
import { WalkInFlow } from '@/components/pages/walk-in-flow';

export const metadata: Metadata = { title: 'Walk-In OPD' };

export default function Page() {
  return <WalkInFlow />;
}
