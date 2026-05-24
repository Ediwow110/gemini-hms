# Phase 21: Demo Request Triage Checklist

Perform this check for every incoming demo request to ensure safety and ethical consistency.

## 1. Ethical Origin Check
- [ ] **Source Verified**: Prospect was identified via public/appropriate sources (no scraping).
- [ ] **No Opt-Out**: Confirmed the organization has not previously opted out or requested silence.

## 2. Role Verification
- [ ] **Decision Influence**: Is the requestor a relevant stakeholder (Clinic Owner, Admin, Medical Director, IT Head)?
- [ ] **Technical Fit**: Do they meet the multi-branch or specialized facility criteria?

## 3. Boundary Alignment (Pre-Demo)
- [ ] **Synthetic Only**: Has the prospect confirmed they accept a **synthetic-data-only** demo?
- [ ] **Local Baseline**: Do they understand the current state is a "Local Green" development baseline (not live cloud)?
- [ ] **No PHI**: Confirmed they are NOT planning to share real patient data during the walkthrough.

## 4. Operational Readiness
- [ ] **Operator Preflight**: Demo operator has run the `no-phi-demo-preflight.md` checklist.
- [ ] **Database State**: Database is verified clean with `[DEMO]` prefixes only.

## 5. Next-Step Clarity
- [ ] **Staging Trigger**: Prospect has been informed that cloud validation requires a **client-funded staging environment**.
- [ ] **Follow-up Path**: A clear follow-up path is defined (e.g., Staging Proposal) if the demo is successful.

## Stop Rules
- **PHI Demand**: If the prospect insists on using real data immediately -> **ABORT** scheduling and escalate.
- **Deception**: If the requestor provided a fake identity or deceptive intent -> **ABORT**.
- **Certification Requirement**: If they require active SOC2/HIPAA certificates before even seeing a demo -> **STOP** and share the `security-privacy-posture.md` document instead.
