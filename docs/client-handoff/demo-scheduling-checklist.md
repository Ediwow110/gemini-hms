# Demo Scheduling Checklist — Gemini-HMS

Complete this checklist **before confirming** any demo appointment.

## Pre-Scheduling Gate

- [ ] **Prospect fit confirmed**: Prospect matches ideal profile (see `ideal-client-profile.md`). Disqualifying signals absent.
- [ ] **Stakeholder role identified**: At least one relevant buyer persona (clinic owner, admin, IT head, ops manager, medical director).
- [ ] **Demo objective clear**: What does the prospect want to see? (Clinical workflow, pharmacy, lab, patient portal?)
- [ ] **No-PHI boundary confirmed**: Prospect agrees demo uses synthetic data only.
- [ ] **Readiness level disclosed**: Prospect understands Gemini-HMS is Local Green — not production-deployed, not HIPAA/SOC2 certified.

## Scheduling Confirmation

- [ ] **Date and time confirmed**: Send calendar invite with clear agenda.
- [ ] **Meeting platform confirmed**: Zoom / Google Meet / Teams. Test link works.
- [ ] **Demo duration confirmed**: 30 minutes recommended. Confirm prospect can stay for full slot.
- [ ] **Attendee list collected**: Names and roles of all attendees. No more than 5–6 recommended.
- [ ] **Backup contact shared**: Share your backup contact method (email or phone) in case of technical issues.

## Environment Readiness (Day Before Demo)

- [ ] **Frontend running**: `npm run dev` or production build on `localhost:5173`.
- [ ] **Backend running**: `npm run start:dev` or equivalent. Health check passes.
- [ ] **Database seeded**: Synthetic demo data applied. Verify `npx prisma migrate status`.
- [ ] **No-PHI preflight executed**: Run `no-phi-demo-preflight.md` checklist.
- [ ] **Screenshot backup ready**: `screenshot-checklist.md` images open in viewer.
- [ ] **Demo runbook rehearsed**: Walk through `demo-runbook.md` sequence at least once.

## Day-of Demo (15 Minutes Before)

- [ ] **No-PHI preflight re-run**: Quick PHI audit query confirmed 0 real names.
- [ ] **Browser**: Open fresh Incognito / Private window. Autofill disabled.
- [ ] **Screen share**: Close all unrelated tabs. Close VS Code / terminal with secrets.
- [ ] **Notifications**: Enable Do Not Disturb on OS and meeting app.
- [ ] **Credentials ready**: Demo user accounts (Doctor, Pharmacist, Patient, Admin) accessible.
- [ ] **Backup plan ready**: Screenshot deck open. `client-summary.md` ready to share.
- [ ] **Forbidden claims list on hand**: See `live-demo-dry-run.md` — do NOT say production-ready, HIPAA-certified, SOC2-certified, cloud-deployed, or cleared for real patient data.

## Post-Scheduling Follow-Up

- [ ] **Confirmation email sent**: Include meeting link, brief agenda, synthetic data note, and duration.
- [ ] **Follow-up template selected**: `client-follow-up-templates.md` ready for post-demo.
- [ ] **Staging proposal ready**: If demo goes well, have `staging-proposal-checklist.md` content ready.

---

**Owner**: Demo Lead
**Reviewed against**: `demo-risk-register.md`, `no-phi-demo-preflight.md`, `live-demo-dry-run.md`
