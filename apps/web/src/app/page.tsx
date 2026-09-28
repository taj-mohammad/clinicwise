import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server-session';

/** Sends each principal to the portal that belongs to them. */
export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect('/portal/login');

  switch (session.principalType) {
    case 'PLATFORM':
    case 'ORG':
      redirect('/admin');
    case 'PATIENT':
      redirect('/patient');
    case 'MR':
      redirect('/mr');
    case 'PHARMACY':
      redirect('/pharmacy');
    case 'LAB':
      redirect('/lab');
    default:
      redirect('/portal');
  }
}
