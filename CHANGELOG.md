# Changelog

All notable changes to Adapted Books are documented here. The format is based
on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Initial release of the Adapted Books platform.
- Multi-tenant Next.js 15 SaaS with Domain-Driven Design and Clean Architecture.
- Auth.js v5 (Credentials + Google providers) with JWT sessions and account lockout.
- Organizations, memberships, and RBAC (OWNER / ADMIN / EDITOR / VIEWER).
- Stories aggregate with social-story generator (text → pages → ARASAAC pictograms).
- Visual story editor (3-panel: pages, preview, properties) with optimistic updates.
- ARASAAC client with caching, retry, exponential backoff, and 429 handling.
- AI module: vendor-agnostic `AIProvider` port, `AIProviderFactory` with env-driven
  provider selection, deterministic `MockAIProvider` (default in dev/tests/offline).
- PDF and ZIP export with high-contrast support.
- Audit log (append-only) wired into every mutation.
- Subscription plans with quotas (FREE plan seeded by default).
- PWA: hand-rolled service worker, manifest, offline page, installable.
- WCAG 2.1 AA: skip link, accessible toolbar (high-contrast + text size), reduced motion.
- Vitest (unit + integration, ≥ 80 % coverage) and Playwright (e2e, 3 browsers).
- Dockerfile (multi-stage, non-root, standalone Next.js), docker-compose,
  GitHub Actions CI, deployment guide.
- Documentation: Architecture, Deployment, Security, Accessibility, Contributing.
- Seed script: demo organization, 3 sample stories with real ARASAAC pictograms.
