# Deployment Guide

This document covers the three recommended deployment paths for Adapted Books:
Vercel (recommended), self-hosted Docker, and Kubernetes.

## Table of contents
1. [Prerequisites](#prerequisites)
2. [Vercel (recommended)](#vercel-recommended)
3. [Self-hosted Docker](#self-hosted-docker)
4. [Kubernetes (Helm)](#kubernetes-helm)
5. [Environment variables reference](#environment-variables-reference)
6. [Database migrations in production](#database-migrations-in-production)
7. [Observability](#observability)
8. [PWA hosting notes](#pwa-hosting-notes)
9. [Backups & disaster recovery](#backups--disaster-recovery)

---

## Prerequisites

- Node.js 20.11+ (Vercel manages this for you)
- pnpm 9.x
- PostgreSQL 16+ (Neon, Supabase, RDS or self-hosted)
- (Optional) Vercel Blob for media — otherwise files are stored on disk
- (Optional) Sentry DSN, OTLP endpoint

---

## Vercel (recommended)

Adapted Books is a standard Next.js 15 App Router project — no special Vercel
configuration is required.

1. **Import the repo** in the Vercel dashboard.
2. **Framework preset**: Next.js (auto-detected).
3. **Build command**: `pnpm run build` (default).
4. **Install command**: `pnpm install --frozen-lockfile`.
5. **Node version**: 20.x (Settings → General → Node.js Version).
6. **Set environment variables** (see reference below). At minimum:
   - `DATABASE_URL`
   - `AUTH_SECRET` — generate with `openssl rand -base64 48`
   - `AUTH_URL` — your production URL
   - `AI_PROVIDER=openai` and `OPENAI_API_KEY=…` (or any other provider)
7. **Provision a Postgres database** (Neon is the easiest; Vercel Marketplace
   has a one-click integration).
8. **Run migrations on the first deploy**:
   - Add a "Post-deploy" command in Vercel: `pnpm prisma migrate deploy`
   - Or run it manually from your CI / from a one-off Vercel function.
9. **Provision a Blob store** (Storage tab) for media, then set
   `BLOB_READ_WRITE_TOKEN`.
10. **Seed** (optional): `pnpm run seed` from the Vercel CLI.

### Custom domain

- Add the domain in the Vercel dashboard.
- Update `AUTH_URL` to `https://your-domain`.
- Update Google OAuth `Authorized redirect URIs` to
  `https://your-domain/api/auth/callback/google`.

---

## Self-hosted Docker

`docker compose up -d` brings up the app + PostgreSQL.

```bash
cp .env.example .env
# Edit .env and set AUTH_SECRET, AI keys, etc.
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app pnpm run seed   # optional
```

The image is multi-stage, runs as non-root (`nextjs` user, UID 1001), and
exposes `/api/health` for container health checks.

### Production behind a reverse proxy

- Terminate TLS at Traefik / Caddy / nginx.
- Forward `X-Forwarded-Proto https` so Auth.js builds correct URLs.
- Set `AUTH_TRUST_HOST=true`.
- Cache `/sw.js` and `/manifest.webmanifest` for a short TTL (1h) and
  `/_next/static/*` for 1y.

---

## Kubernetes (Helm)

A reference Helm chart is in `deploy/helm/adapted-books`. Key knobs:

- `image.repository` / `image.tag`
- `envFrom.secretRef` → `adapted-books-secrets`
- `ingress.host`, `ingress.tls`
- `resources` — start with 250m / 512Mi
- `probes.liveness.path = /api/health`
- `postgresql.enabled = true` (or use an external RDS / Cloud SQL)

Migrations are a separate `Job` (`migration.yaml`) using the same image with
`command: ["npx", "prisma", "migrate", "deploy"]`.

---

## Environment variables reference

See `.env.example` for the canonical list. Highlights:

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | — | `postgresql://user:pass@host:5432/db?schema=public&sslmode=require` |
| `AUTH_SECRET` | yes | — | 32+ random bytes; rotate with care |
| `AUTH_URL` | yes | — | `https://your-domain` |
| `AUTH_TRUST_HOST` | production | `false` | `true` when behind a proxy |
| `AI_PROVIDER` | no | `mock` | `openai` / `anthropic` / `gemini` / `azure_openai` / `ollama` / `lmstudio` / `mock` |
| `OPENAI_API_KEY` | if provider=openai | — | |
| `ANTHROPIC_API_KEY` | if provider=anthropic | — | |
| `GEMINI_API_KEY` | if provider=gemini | — | |
| `AZURE_OPENAI_*` | if provider=azure_openai | — | endpoint + deployment |
| `OLLAMA_BASE_URL` | if provider=ollama | `http://localhost:11434` | |
| `LMSTUDIO_BASE_URL` | if provider=lmstudio | `http://localhost:1234/v1` | |
| `ARASAAC_BASE_URL` | no | `https://api.arasaac.org` | |
| `ARASAAC_STATIC_URL` | no | `https://static.arasaac.org` | |
| `BLOB_READ_WRITE_TOKEN` | no | — | enables Vercel Blob media |
| `LOG_LEVEL` | no | `info` | `fatal` / `error` / `warn` / `info` / `debug` |
| `SENTRY_DSN` | no | — | Sentry error reporting |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | no | — | OpenTelemetry traces |
| `RATE_LIMIT_MAX_REQUESTS` | no | `100` | per window per IP |
| `RATE_LIMIT_AUTH_MAX_REQUESTS` | no | `10` | stricter for auth |

---

## Database migrations in production

- **Never** run `prisma migrate dev` in production.
- Use `prisma migrate deploy` in your release pipeline (Vercel post-deploy,
  GitHub Actions release job, or a Kubernetes `Job`).
- Wrap schema changes with multi-step migrations; never drop a column in the
  same release that reads from it.

---

## Observability

- **Logs**: pino → stdout in JSON format. Anything that ingests container
  stdout (Vercel, Datadog, Loki) just works.
- **Errors**: set `SENTRY_DSN` to enable Sentry error reporting.
- **Traces**: set `OTEL_EXPORTER_OTLP_ENDPOINT` to enable OpenTelemetry.

---

## PWA hosting notes

- The service worker (`/sw.js`) is hand-rolled — no Workbox dependency.
- It is **not** served through the Next.js build; the file in `public/sw.js` is
  served as a static asset. Make sure your CDN does **not** add
  `Cache-Control: immutable` to `/sw.js`; the SW handles its own versioning
  via the cache names (`ab-static-v1.0.0`).
- `manifest.webmanifest` is also static and referenced from
  `src/app/layout.tsx` metadata.

---

## Backups & disaster recovery

- Enable automated daily Postgres snapshots (Neon does this by default).
- Retain at least 14 daily + 4 weekly + 3 monthly snapshots.
- Periodically restore to a scratch database and run the test suite against
  it to validate backups.
- Export the `BLOB` store cross-region if you self-host; on Vercel, enable
  cross-region replication on the Blob store.
