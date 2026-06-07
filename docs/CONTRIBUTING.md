# Contributing

Thanks for your interest in contributing to Adapted Books! This project
welcomes PRs of all sizes.

## Code of conduct

Be kind, assume good faith, focus on the work. We follow the
[Contributor Covenant](https://www.contributor-covenant.org/).

## Development setup

1. Install Node 20.11+ and pnpm 9.x.
2. Clone the repo, `pnpm install`.
3. Copy `.env.example` to `.env` and set `DATABASE_URL` (a local Postgres is
   fine) and `AUTH_SECRET` (use `openssl rand -base64 48`).
4. `pnpm prisma migrate dev` to set up the schema.
5. `pnpm run seed` for demo data.
6. `pnpm dev` to start the dev server at http://localhost:3000.

## Pull request workflow

1. Fork & branch from `main` (`feature/short-description`).
2. Run `pnpm lint && pnpm typecheck && pnpm test` before pushing.
3. Keep PRs focused — one feature or fix per PR.
4. Write tests for every new use case and every new repository method.
5. Update the relevant docs (`docs/ARCHITECTURE.md`, `docs/SECURITY.md`,
   `README.md`) when you add or change architecture.
6. Add an entry to `CHANGELOG.md` under "Unreleased".

## Coding conventions

- **TypeScript strict mode** is on; do not use `any` outside of narrow,
  well-isolated test helpers.
- **No comments** unless they explain a non-obvious decision.
- **No `console.log`** in production code — use the structured logger.
- **Imports**: prefer `@/…` aliases over relative paths.
- **Naming**:
  - Files: `kebab-case.ts`, components: `PascalCase.tsx`.
  - Use cases: `VerbNounUseCase` (e.g. `CreateStoryUseCase`).
  - Repositories: interface `<Entity>Repository`; Prisma impl
    `Prisma<Entity>Repository`.
- **Domain** code may not import from `infrastructure` or `presentation`.
  This is enforced by ESLint and by code review.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(stories): add page reorder action
fix(auth): rotate session on password change
docs(arch): document AI provider swap
test(stories): assert tenant isolation
chore(deps): bump @prisma/client to 5.22.1
```

## Release process

1. `pnpm version` (semver).
2. `pnpm run build` and verify the standalone output.
3. Tag the commit, push the tag.
4. CI builds the Docker image and deploys to staging.
5. Smoke test on staging, then promote to production.

## License

By contributing, you agree that your contributions will be licensed under
the project's AGPL-3.0-or-later license.
