# Ideal Client Profile — Gemini-HMS

## 1. Best-Fit Client Types

| Type | Why Gemini-HMS Fits |
| :--- | :--- |
| **Small Clinic Chains (2–10 branches)** | Multi-tenant, multi-branch RBAC out of the box. Integrated lab and pharmacy workflows reduce vendor sprawl. |
| **Diagnostic / Lab Centers** | End-to-end lab lifecycle (encode → validate → release) with full audit trail. No need for a separate LIS. |
| **Multi-Branch Outpatient Facilities** | Unified patient portal, centralized admin, branch-level isolation. Consistent workflows across locations. |
| **Small Hospitals Seeking Workflow Digitization** | Clinical EMR (vitals, triage, SOAP), order management, and pharmacy dispensing in a single platform. |

## 2. Poor-Fit Clients

| Type | Reason |
| :--- | :------ |
| **Clients demanding immediate production use** | Gemini-HMS is Local Green only — not production-deployed. |
| **Clients requiring HIPAA/SOC2 certification proof before demo** | Certification requires a live staging environment and external audit. Cannot be provided pre-demo. |
| **Clients unwilling to fund staging infrastructure** | Staging (GCP/AWS, ~$50–150/mo) is mandatory for next phase. No self-funded cloud available. |
| **Clients needing eRx or insurance clearinghouse immediately** | eRx and clearinghouse integrations are stub-only; not ready for real use. |
| **Single-location micro-clinics (< 2 providers)** | Platform complexity exceeds need; simpler tools likely sufficient. |
| **Enterprise hospital chains requiring EHR certification** | Gemini-HMS is not ONC-certified nor integrated with major EHR ecosystems. |

## 3. Buyer Personas

| Persona | Typical Concerns | What Resonates |
| :--- | :--- | :--- |
| **Clinic Owner** | Cost, time-to-value, operational efficiency. | Single platform replacing multiple tools; low monthly staging cost. |
| **Hospital Administrator** | Workflow integrity, staff adoption, branch oversight. | Role-based portals, centralized audit, tenant isolation. |
| **Operations Manager** | Daily throughput, error reduction, training burden. | End-to-end clinical flow with guardrails; atomic pharmacy dispensing. |
| **IT Head** | Security, architecture, deployment control. | httpOnly cookies, CSRF, forensic audit chain, multi-tenant design. |
| **Medical Director** | Clinical accuracy, lab reliability, patient safety. | Multi-stage lab validation, locked SOAP after signing, audit trails. |

## 4. Pain Points Gemini-HMS Can Address

- Spreadsheet / paper-based triage and vitals.
- Fragmented lab and pharmacy systems with no shared audit trail.
- Manual prescription-to-dispense handoffs causing errors.
- No role-level access control — staff can see data they should not.
- No forensic audit when clinical data is corrected or amended.
- Patient portal missing — patients call staff for lab results.
- Branch-level data mixing — no tenant isolation between locations.

## 5. Disqualifying Signals

| Signal | Action |
| :--- | :--- |
| "We need production within 2 weeks." | Not feasible — staging + compliance process takes 4–8 weeks minimum. |
| "Do you have HIPAA certification documentation?" | Must explain certification is post-staging, not pre-demo. |
| "Can you demo with our real patient data?" | No. Demo uses synthetic data only. Firm boundary. |
| "We need eRx and real payer integration." | Not available — stub-only. Do not overpromise. |
| "We have no cloud budget." | Staging requires ~$50–150/mo cloud spend. Cannot proceed without it. |
| "We need an ONC-certified EHR." | Gemini-HMS is not ONC certified. |
| "Can we see the source / deploy ourselves?" | Source access is available under contract after staging funding. |

## 6. Ethical Outreach Boundaries

- **No cold scraping**: Do not harvest private contact data. Use publicly listed business contacts and inbound inquiries only.
- **No spam**: Personalize every outreach message. Do not use mass email blasts.
- **No overclaiming**: Never say "production ready," "HIPAA certified," "SOC2 certified," or "cloud deployed."
- **No bait-and-switch**: The demo is a synthetic preview, not a production trial. Make this clear upfront.
- **Opt-out respected**: If a prospect says no or does not respond after 3 attempts, stop.
- **Budget transparency**: Staging cost and funding model must be disclosed before any commitment.
- **No PHI**: Never accept or request real patient data, even for evaluation.
