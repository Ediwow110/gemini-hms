# No-PHI Demo Preflight Checklist

Perform these steps **10 minutes before** every live demonstration to ensure total privacy and system stability.

## 1. Environment & Connectivity
- [ ] **Backend**: Verify server is running (`npm run start:dev` is green).
- [ ] **Frontend**: Verify dashboard loads at `localhost:5173`.
- [ ] **Browser**: Close all tabs. Open a fresh **Incognito/Private** window.
- [ ] **Autofill**: Confirm browser autofill is disabled to prevent accidental credential leakage.

## 2. Data Integrity (The No-PHI Guarantee)
- [ ] **Seed Check**: Run `npx prisma migrate status` to confirm DB is on the latest hardened schema.
- [ ] **PHI Audit**: Manually check the `Patient` table. Ensure every name starts with `[DEMO]` or `[SYNTHETIC]`.
- [ ] **Email Check**: Ensure all user emails end in `.local` or `.demo` (e.g., `doctor@demo.local`).
- [ ] **Safety Query**: Run `SELECT count(*) FROM patients WHERE name NOT LIKE '[DEMO]%';` - Result must be `0`.

## 3. Screen Share Safety
- [ ] **Visible Files**: Ensure no `.env` files are open in VS Code.
- [ ] **Terminal**: Clear terminal history. Ensure no API keys or `DATABASE_URL` strings are visible.
- [ ] **Notifications**: Enable "Do Not Disturb" on your OS to prevent chat popups during demo.

## 4. Fallback Plan
- [ ] **Screenshots**: Keep `docs/client-handoff/screenshot-checklist.md` images open in a viewer as a backup.
- [ ] **Documentation**: Have `product-overview.md` ready to share if the live app fails.

---
**Strict Rule**: If any real patient data is detected, ABORT the demo immediately and reset the database using `npm run db:reset:demo`.
