# Service Level Agreement (SLA) Guarantees

This document outlines the formal Service Level Agreements, uptime guarantees, wait-time SLA alert structures, support tiers, and downtime compensation metrics.

---

## 1. System Uptime SLA (99.99% Objective)
*   **Target Guarantee**: 99.99% monthly availability (allowing no more than 4.38 minutes of unplanned downtime per month).
*   **Measurement Boundary**: Tracked continuously via our dynamic Prometheus Grafana observability pipeline.
*   **Replication Architecture**: Supported by our active-active multi-region database replication clusters.

## 2. Patient Wait-Time SLA
*   **Target Guarantee**: Patient queue time between registration and triage check-in must not exceed **30 minutes**.
*   **Automated Triggers**:
    *   *SLA Alert Service*: Evaluates active queue entry wait-times dynamically.
    *   *Breach Alerts*: Automatically posts high-priority alerts to `SlaAlert` if a patient exceeds 30 minutes.
    *   *Dispatch Notifications*: Sends automated SMS alerts directly to the branch clinic manager.

## 3. Incident Severity & Support Tiers

| Severity | Definition | Target Response Time | Target Resolution Time |
| :--- | :--- | :--- | :--- |
| **Severity 1 (Critical)** | Core platform outage, patient EMR inaccessible, or region replication failure. | 15 Minutes | 2 Hours |
| **Severity 2 (High)** | Single tenant experiencing billing degradation or lab release delays. | 1 Hour | 8 Hours |
| **Severity 3 (Normal)** | Minor clinical note styling issue or configuration requests. | 4 Hours | 24 Hours |

## 4. SLA Downtime Credits

In the event that the monthly uptime target drops below 99.99%, tenants are eligible for monthly fee discounts:

*   **Uptime 99.9% to 99.99%**: 10% credit.
*   **Uptime 99.0% to 99.9%**: 25% credit.
*   **Uptime below 99.0%**: 50% credit.
