# Architecture

Adapted Books is a multi-tenant Next.js 15 SaaS platform built on
**Domain-Driven Design (DDD)** and **Clean Architecture** principles. This
document explains *why* the code is shaped the way it is and how to extend it
without breaking the rules.

## 1. High-level diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              Next.js 15                                 │
│ ┌──────────────────────────┐     ┌────────────────────────────────────┐│
│ │  presentation (app/*)    │ ──▶ │      application (use cases)      ││
│ │  Server Actions          │     │  CreateStory, GenerateStory, ...  ││
│ │  RSC pages               │     └──────────────────┬─────────────────┘│
│ └──────────┬───────────────┘                        │                  │
│            │   ▲                                    ▼                  │
│            │   │  Result<T,E>   ┌────────────────────────────────────┐│
│            │   │  AppError      │         domain (entities, VOs)      ││
│            │   └─────────────── │  Story, Organization, Membership,  ││
│            │                    │  AIProvider (port), Pictogram       ││
│            ▼                    └──────────────────┬─────────────────┘│
│ ┌──────────────────────────┐                       │                  │
│ │  infrastructure          │ ◀── Prisma / Auth.js / Arasaac / OpenAI │
│ │  - persistence           │     pdf-lib / jszip / Vercel Blob       │
│ │  - external services     │                                          │
│ └──────────────────────────┘                                          │
└────────────────────────────────────────────────────────────────────────┘
```

## 2. The dependency rule

> Source code dependencies may only point **inward**. The domain knows
> nothing about HTTP, Prisma, Auth.js or the file system. The application
> layer orchestrates use cases by talking to domain ports. The infrastructure
> layer is the only place where framework and third-party code lives.

```
presentation ──▶ application ──▶ domain
       │                │              ▲
       └────────────────┴──▶ infrastructure
                                  │
                                  └── implements domain ports
```

**Forbidden imports**:
- `domain` may **not** import from `application`, `infrastructure`, or `presentation`.
- `application` may **not** import from `infrastructure` or `presentation`.
- `infrastructure` may import from `domain` and from third-party SDKs.
- `presentation` may import from `application` and from `infrastructure`
  (e.g. for Server Actions that need Prisma-backed queries via use cases).

These rules are enforced by ESLint (`no-restricted-imports`) and by the
test suite (lint fails the build).

## 3. Modules

Each business capability lives in `src/modules/<name>` and follows the same
shape:

```
modules/
  stories/
    domain/
      entities/
      value-objects/
      repositories/      (interfaces only)
      services/          (domain services, port interfaces)
    application/
      use-cases/
      dto/
    infrastructure/
      persistence/       (Prisma repositories)
      services/          (Adapters — e.g. ArasaacClient)
      messaging/         (Future: outbox, queue)
    presentation/
      server-actions/
      components/
      hooks/
```

Adding a new module = copy a sibling, delete what you don't need, add tests.

## 4. Multi-tenancy

- Every business entity carries an `organizationId`.
- Tenant scope is **explicit**: use-case methods take a `TenantContext`
  argument and assert the resource belongs to the actor's organization.
- The edge middleware reads the JWT, decides redirect, and forwards
  `x-tenant-id` to Node runtime; the heavy work (Prisma check, role
  resolution) happens in `requireTenantContext()`.
- Soft-deletes (`deletedAt`) are used everywhere; hard deletes are forbidden
  in production paths.

## 5. Dependency injection

We use a tiny **explicit container** (`src/core/di/container.ts`) — no
decorators, no reflect-metadata. This is intentional:

- Edge runtime compatibility (no Node-specific metadata API).
- Transparent construction graphs (no surprises in the build).
- Trivial to swap in tests.

```ts
const token = createToken<StoryRepository>("StoryRepository");
container.register(token, () => new PrismaStoryRepository(prisma), Lifecycle.Singleton);
const repo = container.resolve(token);
```

Wiring lives in `src/core/di/composition-root.ts` and is invoked once at
server boot.

## 6. Authentication & authorization

- **Authentication**: Auth.js v5 (NextAuth) with the Credentials + Google
  providers, JWT session strategy, Prisma adapter.
- **Authorization**: declarative `can(role, permission)` matrix in
  `src/shared/auth/permissions.ts`. Every server action and every API route
  calls `authorize()` first.

The matrix is the **single source of truth** for RBAC. UI guards are derived
from it (`usePermission` hook).

## 7. AI provider abstraction

The `AIProvider` interface (`src/modules/ai/domain/providers/ai-provider.ts`)
defines 7 methods (`complete`, `generateStory`, `adaptText`,
`suggestPictograms`, `translateText`, `embed`, `moderate`). It is a
**port**; vendors are **adapters** in `infrastructure/providers/`.

- `MockAIProvider` is deterministic and offline — used in dev, tests, and as
  the safe fallback when a real provider is misconfigured.
- The factory (`AIProviderFactory`) switches on `AI_PROVIDER` env var and
  validates that the required keys are present. If a real provider is
  selected without its key, the factory logs a warning and falls back to
  Mock. The strict version (`getStrictProvider`) throws instead — useful in
  production.

### Adding a new provider

1. Implement `AIProvider` in `src/modules/ai/infrastructure/providers/<vendor>/`.
2. Add a case in `AIProviderFactory` keyed off `AI_PROVIDER=<vendor>`.
3. Document the env vars in `.env.example`.
4. Add a unit test that constructs the provider with a mocked HTTP client
   and asserts the request shape.
5. Add an integration test that runs an end-to-end `GenerateStory` flow.

**No change is ever required** in `domain/` or `application/` to add a new
provider.

## 8. Error handling

- Domain and application layers return `Result<T, AppError>` for expected
  failures; they **only** throw on programmer errors (invariant violations).
- The presentation layer maps `AppError` to a JSON response via
  `toHttpResponse(err)` and never leaks stack traces.

```
use case → Result<T, AppError> → action handler → JSON / redirect / toast
                          ↘ programmer error (throw) → global-error boundary
```

## 9. PWA

- Hand-rolled service worker (`public/sw.js`) — no Workbox dep, < 8 KB.
- Strategies: cache-first for `/_next/static`, stale-while-revalidate for
  images, network-first for navigations (3 s timeout, then `/offline.html`).
- The SW is **not** processed by the Next.js build — it's a static asset.
  Cache names are versioned (`ab-static-v1.0.0`) and old caches are
  reclaimed on `activate`.

## 10. Testing strategy

| Layer | Type | Tool | Goal |
| --- | --- | --- | --- |
| Domain | Unit | Vitest | Invariants, no I/O |
| Application | Unit | Vitest | Use-case orchestration with fakes |
| Infrastructure | Unit | Vitest | Adapters with mocked clients |
| Application + Infra | Integration | Vitest + in-memory Prisma | Tenant isolation, transactions |
| Full stack | E2E | Playwright | Critical user journeys |
| Accessibility | E2E | Playwright + axe-core | WCAG 2.1 AA |

Coverage threshold: **80 %** statements / lines / functions, **75 %** branches
(enforced in `vitest.config.ts`).

## 11. Future-proofing

The hexagonal architecture and DI container make the following evolutions
**safe**:

- Replace Prisma with Drizzle / Kysely → swap the `infrastructure/persistence` layer.
- Move Stories to its own microservice → extract `modules/stories` into a
  separate process; everything else continues to depend on its `application`
  contracts.
- Add a queue (e.g. BullMQ) for AI generation → implement
  `application/messaging/Outbox`; the use case enqueues a job instead of
  awaiting the provider.
- Plug in a payments provider (Stripe) → fill out
  `modules/subscriptions/infrastructure/`; the domain and application layers
  are already in place.
