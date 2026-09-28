import type { Metadata } from 'next';
import { Fragment } from 'react';
import { Check, Minus } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/status-pill';
import { PageHeader } from '@/components/shell/page-header';
import { ErrorState } from '@/components/ui/states';
import { serverFetch } from '@/lib/server-session';

export const metadata: Metadata = { title: 'Roles & Permissions' };

interface Matrix {
  roles: { id: string; key: string; name: string; isSystem: boolean; userCount: number; permissions: string[] }[];
  permissions: { key: string; resource: string; action: string }[];
}

export default async function RolesPage() {
  let data: Matrix;
  try {
    data = await serverFetch<Matrix>('/roles/matrix');
  } catch {
    return <ErrorState title="We could not load the permission matrix" />;
  }

  const byResource = new Map<string, Matrix['permissions']>();
  for (const p of data.permissions) {
    byResource.set(p.resource, [...(byResource.get(p.resource) ?? []), p]);
  }

  return (
    <>
      <PageHeader
        title="Roles & permissions"
        description={`${data.roles.length} roles · ${data.permissions.length} permissions. Every grant here is enforced by the API on each request — hiding a menu is never the control.`}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.roles.slice(0, 8).map((role) => (
          <Card key={role.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-ink">{role.name}</p>
                <p className="tnum text-[11px] text-muted">{role.permissions.length} permissions</p>
              </div>
              {role.isSystem ? <StatusPill tone="info">System</StatusPill> : null}
            </div>
            <p className="tnum mt-2.5 border-t border-line pt-2 text-[12px] text-muted">
              {role.userCount} {role.userCount === 1 ? 'user' : 'users'} assigned
            </p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="Permission matrix"
          description="A tick means the role holds that permission."
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-y border-line bg-canvas">
                <th scope="col" className="sticky left-0 z-10 bg-canvas px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-navy-400">
                  Permission
                </th>
                {data.roles.map((role) => (
                  <th key={role.id} scope="col" className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-navy-400">
                    <span className="block max-w-16 truncate" title={role.name}>{role.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...byResource.entries()].map(([resource, perms]) => (
                <Fragment key={resource}>
                  <tr className="bg-navy-50">
                    <th scope="rowgroup" colSpan={data.roles.length + 1} className="sticky left-0 px-4 py-1.5 text-left text-[11px] font-bold capitalize text-navy-600">
                      {resource.replace(/_/g, ' ')}
                    </th>
                  </tr>
                  {perms.map((perm) => (
                    <tr key={perm.key} className="hover:bg-canvas">
                      <th scope="row" className="sticky left-0 z-10 bg-surface px-4 py-2 text-left text-[12px] font-medium text-ink-2">
                        {perm.action.replace(/\./g, ' → ')}
                      </th>
                      {data.roles.map((role) => (
                        <td key={role.id} className="px-2 py-2 text-center">
                          {role.permissions.includes(perm.key) ? (
                            <Check className="mx-auto size-4 text-success" aria-label="Granted" />
                          ) : (
                            <Minus className="mx-auto size-4 text-navy-200" aria-label="Not granted" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
