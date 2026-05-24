# Phase 21: Prospect Scoring Matrix

Use this matrix to prioritize the first 20 prospects for Gemini-HMS. Assign a score of 0 (No Fit) to 3 (Strong Fit) for each dimension.

## Scoring Dimensions

| Dimension | 0 (No Fit) | 1 (Weak) | 2 (Moderate) | 3 (Strong) |
|-----------|------------|----------|--------------|------------|
| **Workflow Fit** | Requires features not yet built (e.g., eRx). | Partial overlap with current modules. | High overlap with Clinical/Lab/Pharmacy. | Exact match for current "Local Green" capabilities. |
| **Multi-Branch** | Single location only. | Planning expansion. | 2 locations. | 3+ branches requiring data sync. |
| **Lab/Pharmacy** | Neither present. | Needs one or the other. | Needs both Lab and Pharmacy. | Primary business is Lab or Pharmacy integration. |
| **Pain Urgency** | Currently happy with existing system. | Minor inefficiencies. | Manual data entry causing significant delays. | Business growth is blocked by lack of digital infrastructure. |
| **Budget Likelihood** | Zero budget for IT. | Minimal budget, price-sensitive. | Can afford cloud hosting ($150+/mo). | Professional IT budget allocated. |
| **Staging Readiness** | No cloud experience. | Has personal AWS/GCP account. | Corporate cloud account exists. | Already uses managed Cloud SQL/K8s. |
| **Compliance Maturity** | No understanding of HIPAA/SOC2. | Aware but no internal policy. | Has existing compliance contact. | Active compliance department looking for hardened systems. |
| **Access** | Cold contact, no response. | Gatekeeper only. | IT Head/Manager level contact. | Direct line to Owner/Medical Director. |
| **Integration** | Requires legacy system API. | Needs data export. | Clean start (greenfield). | Wants to build on top of our open-core baseline. |
| **Disqualification** | Demands real PHI demo. | Demands production-ready now. | No infrastructure funding. | NONE. |

## Decision Framework

- **Score 24+**: **High Priority**. Immediate personalized outreach.
- **Score 16–23**: **Nurture**. Send project overview, follow up in 30 days.
- **Below 16**: **Low Priority**. No outreach at this stage.

## Instructions
1.  Research organization via public website/LinkedIn.
2.  Apply scoring based on public evidence.
3.  Record score in `phase-21-outreach-tracker-seed.md`.
