# Makefile — convenience commands for Enterprise API development

.PHONY: help dev start build docker-up docker-down migrate seed reset \
        test test-unit test-integration lint format studio logs

# Default target
help:
	@echo ""
	@echo "  Enterprise API — Developer Commands"
	@echo "  ─────────────────────────────────────────────────────"
	@echo "  make dev             Start dev server with file watching"
	@echo "  make start           Start production server"
	@echo "  make docker-up       Start Docker stack (API + Postgres + Redis)"
	@echo "  make docker-down     Stop Docker stack"
	@echo "  make docker-dev      Start Docker stack with dev tools (Adminer, Redis UI)"
	@echo "  make migrate         Run Prisma migrations (dev)"
	@echo "  make migrate-prod    Run Prisma migrations (production)"
	@echo "  make seed            Seed the database with fake data"
	@echo "  make reset           Reset DB and re-seed (DEV ONLY)"
	@echo "  make studio          Open Prisma Studio"
	@echo "  make test            Run all tests"
	@echo "  make test-unit       Run unit tests only"
	@echo "  make test-int        Run integration tests only"
	@echo "  make test-cov        Run tests with coverage"
	@echo "  make lint            Lint source files"
	@echo "  make format          Format source files"
	@echo "  make logs            Tail Docker API logs"
	@echo ""

# ─── Development ──────────────────────────────────────────────────────────────

dev:
	npm run dev

start:
	npm run start

# ─── Docker ───────────────────────────────────────────────────────────────────

docker-up:
	docker-compose up -d postgres redis
	@echo "✅ PostgreSQL and Redis started"

docker-app:
	docker-compose up -d
	@echo "✅ Full stack started"

docker-down:
	docker-compose down

docker-dev:
	docker-compose --profile dev up -d
	@echo "✅ Dev stack started (with Adminer on :8080 and Redis Commander on :8081)"

logs:
	docker-compose logs -f api

# ─── Database ─────────────────────────────────────────────────────────────────

migrate:
	npm run db:migrate

migrate-prod:
	npm run db:migrate:prod

seed:
	npm run db:seed

reset:
	@echo "⚠️  This will destroy all data in the development database!"
	npm run db:reset
	npm run db:seed

studio:
	npm run db:studio

generate:
	npm run db:generate

# ─── Testing ──────────────────────────────────────────────────────────────────

test:
	npm test

test-unit:
	npm test -- tests/unit

test-int:
	npm test -- tests/integration

test-cov:
	npm run test:coverage

# ─── Code Quality ─────────────────────────────────────────────────────────────

lint:
	npm run lint

format:
	npm run format

# ─── Setup ────────────────────────────────────────────────────────────────────

setup:
	cp -n .env.example .env || true
	npm install
	npm run db:generate
	npm run db:migrate
	npm run db:seed
	@echo ""
	@echo "✅ Setup complete! Run 'make dev' to start the server."
