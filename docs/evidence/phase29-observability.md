# Phase 29 Observability Evidence

## Scope

This document records whether Gemini HMS exposes enough operational signals to support a production-level runtime.

## Environment

| Field | Value |
|---|---|
| Date | TBD |
| Commit SHA | TBD |
| Operator | TBD |
| Runtime | Local production-equivalent / staging / other |

## Required Checks

| Check | Method | Status | Evidence |
|---|---|---|---|
| Backend health endpoint responds | `GET /health` | Pending |  |
| Frontend responds | `GET /` through production-equivalent entrypoint | Pending |  |
| Backend container healthcheck passes | `docker compose ps` | Pending |  |
| Frontend container healthcheck passes | `docker compose ps` | Pending |  |
| Database container healthcheck passes | `docker compose ps` | Pending |  |
| Application logs are accessible | `docker compose logs backend` | Pending |  |
| Database logs are accessible | `docker compose logs db` | Pending |  |
| Failed healthcheck is detectable | Manual drill | Pending |  |
| Error-rate alert rule defined | Documentation / monitoring config | Pending |  |
| Latency alert rule defined | Documentation / monitoring config | Pending |  |
| Database failure alert rule defined | Documentation / monitoring config | Pending |  |
| Disk/storage alert rule defined | Documentation / monitoring config | Pending |  |
| Auth failure spike alert rule defined | Documentation / monitoring config | Pending |  |

## Minimum Alert Matrix

| Signal | Trigger | Severity | Response |
|---|---|---|---|
| Backend unavailable | Healthcheck fails for 5 minutes | Critical | Rollback or restart, inspect logs |
| Database unavailable | DB healthcheck fails for 5 minutes | Critical | Stop writes, inspect DB, restore if needed |
| 5xx spike | Error rate exceeds threshold | High | Inspect recent deployment and logs |
| Auth failure spike | Login failures exceed baseline | High | Check abuse, credential issues, or outage |
| High latency | p95 latency exceeds threshold | Medium | Inspect DB, CPU, memory, slow endpoints |
| Disk pressure | Storage exceeds threshold | High | Expand storage or rotate logs/backups |

## Final Verdict

- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED

## Notes

A local production-equivalent environment can prove signal availability, but hosted production still requires real alert routing, dashboard ownership, and incident drills.
