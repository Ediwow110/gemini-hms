# Contributing to HMS

Thank you for your interest in contributing to the Hospital Management System.

## Development Setup

### Prerequisites
- Node.js >= 22.0.0
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

### Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and configure
3. Run `docker compose up -d db redis` to start infrastructure
4. Backend: `cd hms-backend && npm ci && npm run prisma:migrate && npm run start:dev`
5. Frontend: `cd hms-frontend && npm ci && npm run dev`

## Code Standards

- TypeScript strict mode — no `any` without explicit justification
- All API endpoints must have DTO validation (class-validator)
- All financial calculations use Decimal (never floating-point)
- All auth-protected routes use guards (fail-closed by default)
- PHI must never appear in logs (use PHI masking interceptor)
- Component tests use React Testing Library + Vitest
- Backend tests use Jest with proper NestJS testing utilities

## Branch Strategy

- `main` — production-ready code
- `staging` — pre-production validation
- `feature/*` — new features (PR into staging)
- `fix/*` — bug fixes (PR into staging or main for critical)

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` — new feature
- `fix:` — bug fix
- `security:` — security fix
- `refactor:` — code restructuring
- `test:` — test additions/changes
- `docs:` — documentation
- `chore:` — maintenance

## Pull Request Process

1. Ensure all tests pass (`npm test` in both frontend and backend)
2. Ensure linting passes (`npm run lint`)
3. Ensure TypeScript compiles (`npm run typecheck`)
4. Add tests for new functionality
5. Update documentation if behavior changes
6. Request review from at least one team member

## Security

- Never commit secrets, credentials, or `.env` files
- Report vulnerabilities via private disclosure (do NOT open public issues)
- All PRs are scanned by Gitleaks, CodeQL, and dependency review
- Patient data (PHI) must never appear in tests, logs, or documentation

## Testing Requirements

- New features require unit tests (minimum 60% coverage)
- Security-critical paths require E2E tests
- Billing changes require concurrency tests
- Auth changes require both unit and E2E coverage
