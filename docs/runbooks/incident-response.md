# Incident Response Runbook

## Purpose

Standardise the response to operational incidents affecting the HMS application. This runbook helps operators triage, mitigate, and learn from incidents in a consistent manner.

## Severity Levels

| Level | Label | Description | Response Time |
|---|---|---|---|
| SEV-1 | Critical | Complete system outage, data loss, or security breach | Immediate, 24/7 |
| SEV-2 | High | Major feature unavailable, degraded performance, potential data issue | < 30 minutes |
| SEV-3 | Medium | Non-critical feature broken, cosmetic issue | < 2 hours |
| SEV-4 | Low | Minor bug, documentation gap, question | Next business day |

## First 15 Minutes Checklist

- [ ] Acknowledge the alert
- [ ] Determine severity level
- [ ] Assign communication owner
- [ ] Assign recovery owner
- [ ] Notify the team via operations channel
- [ ] Check if this is a known issue (search recent incidents)
- [ ] Start a shared incident document (time-stamped)
- [ ] Capture current system state (logs, metrics, traces)

## Triage Flow

```
Alert received
    │
    ├── Is the system completely down?
    │   ├── Yes → SEV-1. Start emergency response.
    │   └── No  → Continue triage.
    │
    ├── Is a core feature failing?
    │   ├── Yes → SEV-2 or higher. Investigate root cause.
    │   └── No  → SEV-3 or lower. Create ticket.
    │
    ├── Is there a data integrity concern?
    │   ├── Yes → SEV-1. Stop all writes immediately.
    │   └── No  → Continue.
    │
    └── Can the system be restored by rollback?
        ├── Yes → Follow rollback.md.
        └── No  → Follow database-restore.md or escalate.
```

## Evidence Collection

- Application logs: `docker logs <container>` or journald
- Database logs: PostgreSQL logs
- Access logs: reverse proxy or load balancer logs
- Metrics snapshot: CPU, memory, disk, network, query latency
- Stack traces or error messages (sanitised: no credentials or PHI)
- Timeline of events: when did it start, when was it detected, what changed

## Communication Owner

- Posts status updates every 30 minutes (SEV-1) or 60 minutes (SEV-2)
- Coordinates with stakeholders
- Decides whether to involve external parties
- Drafts the post-incident summary

## Recovery Owner

- Leads technical investigation and resolution
- Decides on rollback vs. fix-forward
- Coordinates with the communication owner on status
- Documents the root cause and resolution steps

## Post-Incident Review Template

```markdown
## Post-Incident Review — [INCIDENT TITLE]

**Date**: YYYY-MM-DD
**Severity**: SEV-N
**Duration**: HH:MM
**Commander**: @person
**Recovery lead**: @person

### Summary
One-paragraph description of what happened.

### Timeline
- HH:MM — Alert triggered
- HH:MM — Triage started
- HH:MM — Root cause identified
- HH:MM — Mitigation applied
- HH:MM — System verified healthy

### Root Cause
Description of what caused the incident.

### Impact
- Users affected: N
- Downtime: N minutes
- Data loss: None / partial / full

### Action Items
- [ ] Fix root cause (link to issue)
- [ ] Add monitoring/alerting
- [ ] Update runbook
- [ ] Schedule follow-up review

### Lessons Learned
What went well, what went wrong, what to improve.
```

## Example Scenarios

### Auth Outage

**Symptoms**: All login attempts fail. Health check passes.

**Triage**:
1. Check `JWT_SECRET` — was it rotated?
2. Check database connectivity — is the user table accessible?
3. Check auth service logs for errors.
4. Verify token expiry configuration.

**Mitigation**: If JWT_SECRET changed, restore the previous value. If database is unreachable, see database-outage scenario.

### Database Outage

**Symptoms**: All queries fail. Health check returns 503.

**Triage**:
1. Is PostgreSQL running? `systemctl status postgresql`
2. Is disk full? `df -h`
3. Are connections exhausted? `SELECT count(*) FROM pg_stat_activity`
4. Is replication lag critical? (if replica configured)

**Mitigation**: Restart PostgreSQL. If disk is full, purge old logs and temp data. If unrecoverable, follow database-restore.md.

### High 5xx Rate

**Symptoms**: More than 5% of requests return 5xx.

**Triage**:
1. Check recent deployment — rollback if recent.
2. Check database connection pool.
3. Check for upstream dependency failures.
4. Review application error logs for new exceptions.

**Mitigation**: Rollback (see rollback.md) or scale up resources.

### Slow System

**Symptoms**: P95 response time exceeds 5 seconds.

**Triage**:
1. Check database query performance — `pg_stat_activity`, slow query log.
2. Check CPU/memory saturation.
3. Check for connection pool exhaustion.
4. Review recent code changes.

**Mitigation**: Scale horizontally, add indexes, or rollback bad changes.

### Suspected Data Exposure

**Symptoms**: Unauthorised access pattern detected, or report of data leak.

**Triage**:
1. IMMEDIATELY rotate all secrets (JWT_SECRET, DB_PASSWORD, etc.)
2. Revoke all active sessions.
3. Review access logs for the affected period.
4. Assess scope of exposure.

**Mitigation**: Follow security incident protocol. Consult legal/compliance. Do not destroy evidence.

### Failed Deployment

**Symptoms**: CI passes but smoke tests fail after deploy.

**Triage**:
1. Execute rollback immediately (see rollback.md).
2. Document exact failure.
3. Investigate root cause after system is stable.
4. Fix forward in a new PR with additional tests.

**Mitigation**: Rollback to last known good.

---

**Note**: This runbook is operator readiness scaffolding. It does not imply production readiness or compliance certification.
