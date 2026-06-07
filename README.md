# Adapted Books

> Enterprise-grade, multi-tenant SaaS for creating accessible **social
> stories**, **adapted books**, and **educational materials** with **ARASAAC
> pictograms** and an **AI-ready** architecture.

[![CI](https://github.com/your-org/adapted-books/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/adapted-books/actions)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](./LICENSE)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1%20AA-0F7B0F)](./docs/ACCESSIBILITY.md)

---

## Highlights

- **Multi-tenant** from day one (organizations, memberships, RBAC).
- **Clean Architecture + DDD** — `domain` / `application` / `infrastructure`
  / `presentation`, with explicit dependency rules enforced by ESLint and the
  test suite.
- **AI-ready** — vendor-agnostic `AIProvider` port. Add OpenAI, Anthropic,
  Gemini, Azure OpenAI, Ollama, LMStudio or any local model without ever
  touching the domain layer.
- **ARASAAC pictograms** with caching, retry, and graceful fallback.
- **PWA** — hand-rolled service worker (< 8 KB), offline fallback,
  installable on iOS / Android / desktop.
- **WCAG 2.1 AA** — high-contrast mode, text-size scaling, skip link,
  accessible toolbar, keyboard-first navigation.
- **80 %+ test coverage** — Vitest (unit + integration) and Playwright (e2e).
- **Production-ready deploys** — Dockerfile + docker-compose, Vercel-ready,
  CI workflow included.

## Architecture

```
src/
├── app/                  Next.js App Router (RSC, layouts, server actions)
├── components/           Shared UI primitives (shadcn/ui, a11y)
├── core/                 Framework-agnostic: DI, Result, errors, env, logger
├── lib/                  Cross-cutting adapters: Prisma, rate limit, utils
├── modules/              Business capabilities (Clean Architecture)
│   ├── auth/             Auth.js v5, providers, security
│   ├── organizations/    Tenants, memberships
│   ├── users/            Profiles, accounts
│   ├── stories/          Stories aggregate (core domain)
│   ├── pictograms/       ARASAAC client
│   ├── ai/               Provider-agnostic AI
│   ├── export/           PDF, ZIP export
│   ├── audit/            Append-only log
│   └── subscriptions/    Plans, quotas (Stripe-ready)
└── shared/               tenant context, guards, permissions
```

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the full breakdown and
[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for deployment paths.

## Quick start

```bash
# 1. Prereqs
node --version    # >= 20.11
pnpm --version    # >= 9

# 2. Install
pnpm install

# 3. Configure
cp .env.example .env
# Edit .env and set DATABASE_URL + AUTH_SECRET
openssl rand -base64 48 | head -c 64  # → AUTH_SECRET

# 4. Database
pnpm prisma migrate dev
pnpm run seed    # creates demo org, users, and 3 sample stories

# 5. Run
pnpm dev
# → http://localhost:3000

# 6. Test
pnpm test            # unit + integration
pnpm test:e2e        # Playwright
```

### Demo login (after `pnpm run seed`)

| Email | Password | Role |
| --- | --- | --- |
| `demo@adaptedbooks.app` | `Demo12345!` | OWNER |
| `editor@adaptedbooks.app` | `Demo12345!` | EDITOR |
| `viewer@adaptedbooks.app` | `Demo12345!` | VIEWER |

## Configuration

All runtime config is validated by Zod at boot — see
[`src/core/types/env.ts`](./src/core/types/env.ts) and
[`.env.example`](./.env.example).

Minimum required env vars:

```dotenv
DATABASE_URL=postgresql://user:pass@localhost:5432/adapted?schema=public
AUTH_SECRET=change-me-to-a-random-64-byte-string
AUTH_URL=http://localhost:3000
```

Optional but recommended:

```dotenv
AI_PROVIDER=mock                 # openai | anthropic | gemini | azure_openai | ollama | lmstudio | mock
OPENAI_API_KEY=…                 # only if AI_PROVIDER=openai
ANTHROPIC_API_KEY=…              # only if AI_PROVIDER=anthropic
ARASAAC_BASE_URL=https://api.arasaac.org
ARASAAC_STATIC_URL=https://static.arasaac.org
BLOB_READ_WRITE_TOKEN=…          # enables Vercel Blob media
SENTRY_DSN=…                     # enables Sentry error reporting
```

### Switching AI providers

```bash
# Use OpenAI
AI_PROVIDER=openai OPENAI_API_KEY=sk-… pnpm dev

# Use a local Ollama instance
AI_PROVIDER=ollama OLLAMA_BASE_URL=http://localhost:11434 pnpm dev

# Use Anthropic
AI_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-ant-… pnpm dev
```

The factory ([`src/modules/ai/infrastructure/ai-provider-factory.ts`](./src/modules/ai/infrastructure/ai-provider-factory.ts))
selects the right adapter at boot. No code change is needed to add a new
vendor — see the [Architecture doc](./docs/ARCHITECTURE.md#7-ai-provider-abstraction).

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build (incl. Prisma generate) |
| `pnpm start` | Run the production build |
| `pnpm lint` / `pnpm lint:fix` | ESLint |
| `pnpm typecheck` | TypeScript (`tsc --noEmit`) |
| `pnpm format` | Prettier |
| `pnpm test` | Unit + integration (Vitest) |
| `pnpm test:coverage` | With coverage report |
| `pnpm test:e2e` | Playwright e2e |
| `pnpm prisma:migrate` | Apply migrations in dev |
| `pnpm prisma:studio` | Open Prisma Studio |
| `pnpm seed` | Populate demo data |

## RBAC matrix

| Permission | OWNER | ADMIN | EDITOR | VIEWER |
| --- | :-: | :-: | :-: | :-: |
| `organization.delete` | ✓ | | | |
| `members.invite` | ✓ | ✓ | | |
| `members.update_role` | ✓ | ✓ | | |
| `stories.create` | ✓ | ✓ | ✓ | |
| `stories.update` | ✓ | ✓ | ✓ | |
| `stories.delete` | ✓ | ✓ | | |
| `stories.publish` | ✓ | ✓ | ✓ | |
| `ai.generate` | ✓ | ✓ | ✓ | |
| `export.pdf` | ✓ | ✓ | ✓ | ✓ |
| `audit.view` | ✓ | ✓ | | |

Defined in [`src/shared/auth/permissions.ts`](./src/shared/auth/permissions.ts).

## Accessibility

- WCAG 2.1 AA compliant.
- High-contrast mode (`.hc`), text-size scaling (`data-text-size`).
- Skip-to-content link, focus-visible rings, ARIA live regions for toasts.
- Tested with NVDA, VoiceOver, JAWS.

See [docs/ACCESSIBILITY.md](./docs/ACCESSIBILITY.md).

## Security

- Tenant isolation enforced at the repository, use-case, and middleware
  layers (defence in depth).
- Rate limiting (100 req / min global, 10 req / 5 min on auth).
- CSP-friendly headers; no third-party scripts in the runtime.
- DOMPurify on every user-supplied HTML; React's default escaping elsewhere.
- pino logger with secret redaction; Sentry-compatible.

See [docs/SECURITY.md](./docs/SECURITY.md).

## Deploy

| Path | Guide |
| --- | --- |
| Vercel (recommended) | [docs/DEPLOYMENT.md#vercel-recommended](./docs/DEPLOYMENT.md#vercel-recommended) |
| Self-hosted Docker | [docs/DEPLOYMENT.md#self-hosted-docker](./docs/DEPLOYMENT.md#self-hosted-docker) |
| Kubernetes (Helm) | [docs/DEPLOYMENT.md#kubernetes-helm](./docs/DEPLOYMENT.md#kubernetes-helm) |

## License

AGPL-3.0-or-later — see [LICENSE](./LICENSE). For a commercial license that
does not require source disclosure, contact **sales@adaptedbooks.app**.

## Acknowledgements

- [ARASAAC](https://arasaac.org) — the pictogram library we depend on.
- The autism, special-education, and AAC communities who inspire this work.
