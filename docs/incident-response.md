# Incident Response Manual (HMS Enterprise GA)

This manual defines the HMS Incident Management Framework, detailing critical severity matrices (SEV1-SEV4), notification intervals, and pre-approved messaging templates to keep customers and stakeholders informed during an active outage.

## 1. Severity Levels & Incident Matrix

| Severity | Definition | Target Response (TTR) | SRE/CTO Pager Target | Update Interval |
| :--- | :--- | :--- | :--- | :--- |
| **SEV1** | **Critical Outage**: Complete system blackout, active database corruption, or massive clinical/EMR flow blockage across tenants. | **< 15 Minutes** | Instant | Every 15 Minutes |
| **SEV2** | **Major Outage**: Core features compromised (e.g., Billing or LIS offline), but read-only EMR/clinical access remains active. | **< 30 Minutes** | 5 Minutes | Every 30 Minutes |
| **SEV3** | **Minor Degradation**: System latency spikes (`p95 > 2s`), or non-critical modules (e.g., Reports/Analytics) are slow or failing. | **< 2 Hours** | 15 Minutes | Every 1 Hour |
| **SEV4** | **Cosmetic / Minor Bug**: Operational stubs, styling issues, or transient analytical calculation glitches. | **< 24 Hours** | Next business day | On resolution |

---

## 2. Customer Update Messaging Templates

### A. SEV1 Incident - Acknowledgment & Mitigation Template
Use this template for initial communication within **15 minutes** of a SEV1 incident:
```markdown
Subject: [INVESTIGATING] HMS System Outage - Incident #{{INCIDENT_ID}}

Dear HMS Customer Operations,

At {{TIMESTAMP_UTC}} UTC, our SRE team identified a critical disruption impacting access to the HMS backend services. 

- Status: Active Outage (SEV1)
- Impact: Users may experience timeouts or failures when logging in or saving records.
- Action: Our principal database and network teams are actively tracing the root cause in the primary region cluster. 

We will provide our next operational update in 15 minutes. 
Live status dashboard: https://status.hospital-hms.local/incidents/{{INCIDENT_ID}}
```

### B. SEV1 Incident - Mitigation & Resolution Template
Use this template immediately after normal services are restored:
```markdown
Subject: [RESOLVED] HMS System Outage - Incident #{{INCIDENT_ID}}

Dear HMS Customer Operations,

We are pleased to report that the core HMS platform services have been successfully restored as of {{TIMESTAMP_UTC}} UTC.

- Resolution Summary: SREs resolved a transient database connection exhaustion issue. Alternate replicas have been verified as fully operational.
- Data Integrity Check: Fully completed. Cryptographic chain-of-custody verification confirms zero data loss or database record tampering occurred during the disruption.
- Post-Mortem Status: SRE teams will compile a detailed Root Cause Analysis (RCA) within 24 hours.

We sincerely appreciate your patience and remain committed to maintaining maximum uptime for your clinical workflows.
```
