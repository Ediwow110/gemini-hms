# Final Demo Operator Checklist

## 24 Hours Before Demo
- [ ] **Data Audit**: Run `npm run db:check:demo` to verify all records are correctly prefixed.
- [ ] **Data Sync**: If audit fails, run `DEMO_DB_FIX_CONFIRM=FIX_SYNTHETIC_DEMO_LABELS npm run db:fix:demo` to apply prefixes.
- [ ] **Feature Audit**: Briefly login as each role (Doctor, Lab, Pharmacist, Patient, Admin) to ensure routes load.
- [ ] **Infrastructure**: Verify local machine has 8GB+ RAM available for parallel Node.js processes.

## 2 Hours Before Demo
- [ ] **Clean Restart**: Reboot machine or run `taskkill` on all node processes to ensure ports 3000 and 5173 are free.
- [ ] **Visual Check**: Open `http://localhost:5173` and verify the login screen appears.
- [ ] **Screenshot Prep**: Have `docs/client-handoff/screenshot-checklist.md` images open in a viewer.

## 15 Minutes Before Demo
- [ ] **Private Window**: Open a fresh Incognito/Private window.
- [ ] **Distractions**: Enable "Do Not Disturb" on OS. Close Slack, Email, and irrelevant browser tabs.
- [ ] **VS Code**: Close all `.env` files and clear the integrated terminal.
- [ ] **Disclaimer**: Verify you have the "Opening Disclaimer" from `live-demo-dry-run.md` visible on a second screen or paper.

## During Demo
- [ ] **Disclaimer FIRST**: Do not show any data before stating the synthetic data disclaimer.
- [ ] **Timing**: Aim for 15 minutes for the "Happy Path" and 15 minutes for Q&A/Deep Dive.
- [ ] **Safety**: If asked "Can we see real data?", use the response: *"We strictly use synthetic data to maintain privacy and security during demonstrations."*

## If Something Fails
- [ ] **Don't Panic**: Explain that this is a "Local Green" development baseline.
- [ ] **Switch to Static**: Immediately minimize the browser and show the prepared screenshots.
- [ ] **Explain Forensic Audit**: Mention that the failure is being logged in the forensic audit trail for analysis.

## Nuclear Reset (Emergency Only)
- [ ] **Action**: Run `DEMO_DB_RESET_CONFIRM=RESET_SYNTHETIC_DEMO_DB npm run db:reset:demo:safe -- --confirm-demo-reset`.
- [ ] **WARNING**: This script is DESTRUCTIVE. It will wipe the current database and re-seed from scratch. NEVER run this against a production or staging database. It is guarded to only run against local/test databases.

## Forbidden Phrases
- "This is production-ready."
- "We are HIPAA certified."
- "We have SOC2 certification."
- "This is live on the cloud."
- "You can enter real patient data now."

## Required Phrases
- "Locally verified baseline."
- "Synthetic demo data only."
- "Designed for HIPAA/SOC2 compliance."
- "Client-funded staging environment required for cloud validation."
