# CliniqX

**Smart Clinic. Connected Care.**
Powered by Intigus Pharmaceutical Private Limited

A multi-tenant clinic management and digital healthcare platform.

## Status

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Monorepo, database, RBAC catalogue, authentication, audit, seed data | **Built and verified** |
| 1 | Design system, app shell | In progress |
| 2–8 | Admin/clinic/doctor/patient portals, scheduling, clinical, labs, pharmacy, HR, payments, notifications, PWA, tests, deployment | Not started |

## Stack

Next.js · NestJS · PostgreSQL · Prisma · Redis · TypeScript · pnpm + Turborepo

## Getting started

```bash
pnpm install
docker compose up -d          # PostgreSQL :5433, Redis :6380
cp .env.example .env
pnpm db:push
pnpm db:seed
pnpm dev
```

API: http://localhost:4100/api — Swagger at `/api/docs` in development.

## Demo accounts

Password for every seeded account: `CliniqX@2026`

| Portal | Route | Account |
| --- | --- | --- |
| Super admin | `/admin/login` | `superadmin@cliniqx.demo` |
| Organisation admin | `/admin/login` | `orgadmin@cliniqx.demo` |
| Clinic admin | `/portal/login` | `clinicadmin1@cliniqx.demo` |
| Doctor | `/portal/login` | `doctor1@cliniqx.demo` |
| Staff | `/portal/login` | `staff1@cliniqx.demo` |
| MR | `/mr/login` | `mr1@cliniqx.demo` |
| Pharmacy | `/pharmacy/login` | `pharmacy1@cliniqx.demo` |
| Lab | `/lab/login` | `lab1@cliniqx.demo` |
| Patient | `/patient/login` | mobile OTP — codes are printed to the API log in development |

## Repository layout

```
apps/api        NestJS API — auth, RBAC, audit, domain modules
apps/web        Next.js application (all portals)
packages/db     Prisma schema, client, seed
packages/shared Permission catalogue and role grants
packages/config Shared TypeScript configuration
docs/           Architecture, security, deployment, API
```

## Security model

- Permissions are the only authorisation unit; menu visibility is never security.
- The actor's permissions are rebuilt from the database on every request, so a
  revoked role takes effect immediately rather than at the next token refresh.
- Refresh tokens are opaque, hashed at rest, and rotated on every use; replay of
  a spent token revokes the whole session family.
- Medical documents are private and reachable only through short-lived signed URLs.
- Every access to protected health information is audited.

See [docs/SECURITY.md](docs/SECURITY.md).
