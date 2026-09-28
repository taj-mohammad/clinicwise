/**
 * Browser API client. Requests are same-origin (Next rewrites /api to the
 * NestJS server), so the HttpOnly auth cookies travel automatically and no
 * token is ever handled by page scripts.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors?: { field: string; message: string }[],
    readonly reference?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Set on the server, where cookies must be forwarded explicitly. */
  cookieHeader?: string;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, cookieHeader, headers, ...rest } = options;

  const res = await fetch(path.startsWith('http') ? path : `/api${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 204) return undefined as T;

  const payload = await res.json().catch(() => ({}) as Record<string, unknown>);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      typeof payload.message === 'string' ? payload.message : 'Something went wrong',
      Array.isArray(payload.errors) ? (payload.errors as ApiError['fieldErrors']) : undefined,
      typeof payload.reference === 'string' ? payload.reference : undefined,
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => apiFetch<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: RequestOptions) => apiFetch<T>(path, { ...opts, method: 'DELETE' }),
};
