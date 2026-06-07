.PHONY: help install db seed dev build start test test-unit test-int test-e2e lint typecheck format clean docker docker-down reset

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pnpm install

db: ## Apply database migrations
	pnpm prisma migrate dev

seed: ## Populate demo data
	pnpm run seed

dev: ## Start dev server
	pnpm dev

build: ## Production build
	pnpm build

start: ## Run production build
	pnpm start

test: ## Run unit + integration tests
	pnpm test

test-unit: ## Unit tests only
	pnpm test:unit

test-int: ## Integration tests only
	pnpm test:integration

test-e2e: ## Playwright e2e
	pnpm test:e2e

lint: ## Lint
	pnpm lint

typecheck: ## Typecheck
	pnpm typecheck

format: ## Format with Prettier
	pnpm format

docker: ## Boot Docker stack
	docker compose up -d --build

docker-down: ## Tear down Docker stack
	docker compose down

reset: ## Reset database (DESTRUCTIVE)
	pnpm prisma migrate reset --force
