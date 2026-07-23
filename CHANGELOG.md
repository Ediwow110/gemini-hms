# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-rc.1] - 2026-07-23

### Added
- Multi-tenant hospital management with branch isolation
- Role-based access control (17+ roles) with permission-based guards
- MFA with TOTP enrollment, verification, and recovery codes
- Patient portal with self-service lab results, prescriptions, and invoices
- Billing module with idempotent payments, voids, refunds, and session close
- Pharmacy module with prescription dispensing and inventory management
- Audit trail with HMAC hash chain for tamper-evidence
- PHI masking interceptor for non-privileged roles
- Real-time notifications via WebSocket
- Analytics dashboards with role-scoped metrics
- CI/CD pipeline with security scanning (Gitleaks, CodeQL, Trivy, SBOM)
- Load test suite (k6) for auth, billing, and analytics
- Session idle timeout with HIPAA-compliant auto-logout

### Security
- JWT with stateful sessions and token rotation with replay detection
- Account lockout (5 attempts, 15-minute lock) on all auth endpoints
- CSRF double-submit cookie pattern
- Rate limiting with tiered throttles (auth: 5/min, sensitive: 20/min, default: 100/min)
- Helmet with environment-aware CSP
- HttpOnly, SameSite=strict cookies for auth tokens
- AES-256-GCM encryption for TOTP secrets
- Bcrypt password hashing (12 rounds)
- Input validation with whitelist + forbidNonWhitelisted
- Kubernetes NetworkPolicies for pod isolation
- Nginx security headers (CSP, HSTS, X-Frame-Options)
- Encrypted database backups (GPG)

### Fixed
- Patient portal token revocation (was stateless with no invalidation)
- Patient portal account lockout (was missing)
- CSRF cookie httpOnly flag (was incorrectly set to true)
- Audit chain race condition (added serializable transaction)
- Payment method validation (now enum-constrained)
- Nginx missing security headers and compression

## [Unreleased]

### Planned
- HIPAA compliance certification
- SOC 2 Type II audit
- Distributed tracing (OpenTelemetry)
- Centralized log aggregation
- Visual regression testing
- Contract testing (frontend <-> backend)
