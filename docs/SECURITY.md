# Security

Adapted Books is designed for an audience that includes children and
vulnerable users. Security is treated as a first-class concern.

## Reporting vulnerabilities

Please email **security@adaptedbooks.app** with a description of the issue
and reproduction steps. We aim to acknowledge within 48 h and to ship a fix
within 30 days for high-severity issues.

## Threat model (summary)

| Threat | Mitigation |
| --- | --- |
| Cross-tenant data leak | `organizationId` carried on every entity; explicit `assertTenant()` in use cases; integration tests assert isolation. |
| Privilege escalation | `can(role, permission)` matrix; every server action and API route calls `authorize()`. |
| Credential stuffing / brute force | bcryptjs with cost 12, account lockout, rate limiting on `/api/auth/*` (10 req / 5 min per IP). |
| CSRF | Auth.js + same-site `__Host-` cookies in production; `Origin` checks in server actions. |
| XSS | `isomorphic-dompurify` for any user-supplied HTML; React's default escaping everywhere else; CSP via response headers. |
| SSRF | ARASAAC client only talks to `ARASAAC_BASE_URL`; no user-supplied URLs are fetched. |
| Open redirect | `redirect()` calls in server actions use a relative path whitelist. |
| Secrets in logs | `pino` redactor configured for `password`, `token`, `secret`, `authorization`, `cookie`. |
| Dependency CVEs | Renovate + `pnpm audit` in CI; weekly review. |
| Backup tampering | (Operational) Postgres point-in-time recovery; nightly snapshots to immutable storage. |

## Tenant isolation — the rules

1. **Every** business entity has a non-nullable `organizationId` column.
2. **Every** use case method takes a `TenantContext` and either:
   - queries by `organizationId = ctx.organizationId`, **or**
   - receives a resource that has been pre-scoped, and asserts ownership
     with `assertTenant(ctx, resource.organizationId)`.
3. **No** repository method accepts a "global" query — they all require an
   `organizationId` argument. This is enforced by the `Prisma*Repository`
   type signatures.
4. The session token carries `activeOrganizationId`; the middleware forwards
   `x-tenant-id` so the Node runtime can read it without a database hop.

## Secrets

- `.env` is never committed (`.gitignore`).
- All secrets are loaded through Zod-validated env types
  (`src/core/types/env.ts`) and never logged.
- The `AUTH_SECRET` is rotated via a documented runbook (see
  `docs/RUNBOOKS.md`).

## Rate limits

- Global: 100 requests / minute / IP.
- Auth endpoints: 10 requests / 5 minutes / IP.
- Export endpoints: 10 requests / hour / user.

The default implementation is in-memory; production deployments swap in the
Redis-backed adapter (interface-compatible).

## Headers (set in `next.config.ts`)

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-XSS-Protection: 1; mode=block`
- `Cache-Control: no-store, max-age=0` on all `/api/*` responses.

## Logging

- `pino` is configured at `info` level in production, `debug` in dev.
- The redactor strips the following keys: `password`, `token`, `secret`,
  `authorization`, `cookie`, `set-cookie`.
- Errors include a `correlationId` (from `x-correlation-id` header injected
  by middleware) so logs can be traced end-to-end.
