# Phase 21: Batch 1 Response Logging Plan

Establishing the protocol for tracking incoming inquiries while maintaining strict privacy and technical boundaries.

## 1. Primary Log Location
- **Tracking File**: `docs/client-handoff/phase-21-outreach-tracker-seed.md` (or the production CRM).
- **Consolidated Batch Table**: `docs/client-handoff/phase-21-batch-1-prospect-table.md` (`Status` column).

## 2. What to Log
- **Date Received**: For cadence management.
- **Sentiment**: Interested, Not Interested, Question, Opt-Out.
- **Classification**: (e.g., "Demo Requested", "Compliance Question") per the Matrix.
- **Next Step Date**: When the follow-up is scheduled.
- **Owner**: Assigned team member.

## 3. What NOT to Log (Strict Rules)
- **NO PHI**: Never copy patient names or clinical case details shared by the prospect.
- **NO Private Emails**: Do not store the sender's personal email if it was not already public.
- **NO Sensitive Feedback**: Summarize technical concerns (e.g., "MFA question") rather than storing full message text.
- **NO Personal Details**: Avoid recording the sender's home location, family details, or private social profiles.

## 4. Response Workflow
1. **Initial Review**: Match reply against `phase-21-response-classification-matrix.md`.
2. **Template Selection**: Use the approved truthful template from `phase-21-response-templates.md`.
3. **Safety Gate**: If the prospect asks to use real data -> Trigger `phase-21-safety-escalation-playbook.md`.
4. **Log Update**: Update the status to `ENGAGED` or `SCHEDULED`.

## 5. Opt-Out Procedure
- If a prospect says "Stop" or equivalent:
  - Mark `Opt-Out`: [X] in the tracker.
  - Set `Status`: STOP.
  - Cease all outbound contact immediately.

## 6. Reporting
- Update the `phase-21-outreach-kpi-template.md` every Friday with batch counts.
- High opt-out rate (>25%) requires an immediate pause and segment review.
