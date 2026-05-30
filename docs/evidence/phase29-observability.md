# Phase 29 Observability Evidence

## Scope

This document records whether Gemini HMS exposes enough operational signals to support a production-level runtime.

## Environment

| Field | Value |
|---|---|
| Date | 2026-05-30 |
| Commit SHA | 6d4cff5 |
| Operator | automated-ci |
| Runtime | Local production-equivalent (Docker Compose) |

## Required Checks

| Check | Method | Status | Evidence |
|---|---|---|---|
| Backend health endpoint responds | `curl http://backend:3000/health` (Docker-internal) | PASS | Returns `{"status":"UP","timestamp":"..."}`. Container healthcheck uses this. |
| Frontend responds | `curl http://localhost:8080/` | PASS | Returns HTML with `<div id="root">`. Healthcheck uses `wget -qO- http://localhost/`. |
| Backend container healthcheck passes | `docker compose ps` | PASS | Status: `healthy` (started within 20s, `start_period: 20s`, retries: 5). |
| Frontend container healthcheck passes | `docker compose ps` | PASS | Status: `healthy` (started within 10s, `start_period: 10s`, retries: 5). |
| Database container healthcheck passes | `docker compose ps` | PASS | Status: `healthy` (pg_isready check, 10s interval). |
| Application logs are accessible | `docker compose logs backend` | PASS | Logs output as expected, shows NestJS boot messages. |
| Database logs are accessible | `docker compose logs db` | PASS | Logs show PostgreSQL startup, ready to accept connections. |
| Failed healthcheck is detectable | Manual simulation | PASS | Backend could not start when DATABASE_URL was wrong; backend showed `unhealthy` in `docker compose ps`. Detectable within 20s `start_period` + 5 retries × 30s = ~170s. |
| Error-rate alert rule defined | Documentation review | DOCUMENTED_ONLY | Alert matrix defined below. No hosted monitoring tool configured. |
| Latency alert rule defined | Documentation review | DOCUMENTED_ONLY | Alert matrix defined below. No hosted monitoring tool configured. |
| Database failure alert rule defined | Documentation review | DOCUMENTED_ONLY | Alert matrix defined below. No hosted monitoring tool configured. |
| Disk/storage alert rule defined | Documentation review | DOCUMENTED_ONLY | Alert matrix defined below. No hosted monitoring tool configured. |
| Auth failure spike alert rule defined | Documentation review | DOCUMENTED_ONLY | Alert matrix defined below. No hosted monitoring tool configured. |

## Minimum Alert Matrix

| Signal | Trigger | Severity | Response |
|---|---|---|---|
| Backend unavailable | Healthcheck fails for 5 minutes | Critical | Rollback or restart, inspect logs |
| Database unavailable | DB healthcheck fails for 5 minutes | Critical | Stop writes, inspect DB, restore if needed |
| 5xx spike | Error rate exceeds threshold | High | Inspect recent deployment and logs |
| Auth failure spike | Login failures exceed baseline | High | Check abuse, credential issues, or outage |
| High latency | p95 latency exceeds threshold | Medium | Inspect DB, CPU, memory, slow endpoints |
| Disk pressure | Storage exceeds threshold | High | Expand storage or rotate logs/backups |

## Known Observability Gaps

1. **No hosted monitoring dashboard**: No Grafana, Datadog, or similar tool configured. All signals are available via `docker compose logs` and manual healthcheck polling.
2. **No real alert routing**: No PagerDuty, OpsGenie, Slack webhook, or email alert integration. Alerts are documented only.
3. **No escalation ownership**: No on-call rotation or escalation policy defined.
4. **No incident drills**: Runbooks exist (Phase 29D) but have not been exercised in a real or simulated incident.
5. **Health endpoint not proxied**: The backend `/health` endpoint is not accessible through the frontend Nginx proxy (which only forwards `/api/` and `/patient-portal/`). External monitoring must target the backend directly via Docker-internal networking or a dedicated Nginx location block.
6. **No synthetic monitoring**: No external synthetic check (e.g., Pingdom, Checkly) configured.

## Final Verdict

- [x] PASS (signal availability)
- [ ] FAIL
- [ ] BLOCKED

## Notes

A local production-equivalent environment can prove signal availability, but hosted production still requires real alert routing, dashboard ownership, and incident drills.

System remains **STAGING-ONLY**. Not production-ready.
