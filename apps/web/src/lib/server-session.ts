import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SessionUser } from '@/hooks/use-session';

const API_URL = process.env.API_URL ?? 'http://localhost:4100';

/**
 * Resolves the signed-in user on the server. Cookies must be forwarded
 * explicitly because this runs outside the browser's cookie jar.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const header = cookieStore.toString();
  if (!header) return null;

  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { cookie: header },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as SessionUser;
  } catch {
    return null;
  }
}

/** Guards a portal route group; sends unauthenticated visitors to its login page. */
export async function requireSession(loginPath: string): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect(loginPath);
  return session;
}

/** Server-side fetch helper for page data, carrying the caller's cookies. */
export async function serverFetch<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: { cookie: cookieStore.toString() },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}
