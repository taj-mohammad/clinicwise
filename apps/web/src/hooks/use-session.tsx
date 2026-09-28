'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import type { Permission } from '@cliniqx/shared';

export interface SessionUser {
  id: string;
  fullName: string;
  email: string | null;
  mobile: string | null;
  organizationId: string | null;
  principalType: string;
  roles: string[];
  permissions: string[];
  clinicIds: string[];
  doctorId: string | null;
  staffId: string | null;
  patientId: string | null;
  /** Display context resolved server-side so the shell renders without a round trip. */
  organizationName?: string | null;
  primaryRoleLabel?: string;
  specialty?: string | null;
  locations?: { id: string; name: string; clinicName: string }[];
}

interface SessionValue {
  user: SessionUser;
  has: (permission: Permission) => boolean;
  hasAny: (...permissions: Permission[]) => boolean;
  isRole: (...roles: string[]) => boolean;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const permissionSet = useMemo(() => new Set(user.permissions), [user.permissions]);

  const has = useCallback(
    (permission: Permission) => permissionSet.has(permission),
    [permissionSet],
  );
  const hasAny = useCallback(
    (...permissions: Permission[]) => permissions.some((p) => permissionSet.has(p)),
    [permissionSet],
  );
  const isRole = useCallback(
    (...roles: string[]) => roles.some((r) => user.roles.includes(r)),
    [user.roles],
  );

  const value = useMemo(() => ({ user, has, hasAny, isRole }), [user, has, hasAny, isRole]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside a SessionProvider');
  return ctx;
}
