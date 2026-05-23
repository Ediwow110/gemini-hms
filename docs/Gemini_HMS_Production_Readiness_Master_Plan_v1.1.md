# Gemini-HMS Production Readiness Master Plan — Revised v1.1

Date: 2026-05-18
Repository: https://github.com/Ediwow110/gemini-hms
Change log:
- 1.1: Removed unverified "PRODUCTION READY"/certification claims and added an Evidence Index, artifact paths and owners, explicit SLOs, migration policy, and concrete secret-scan commands. (Author: Copilot-assisted revision)

---

1. EXECUTIVE SUMMARY & CURRENT STATE ASSESSMENT (REVISED)

Project Overview
Gemini-HMS is a multi-tenant Hospital Management System plus B2B medical equipment commerce platform covering clinical workflows (EMR, lab, pharmacy), operations (HR, billing, procurement, inventory), and equipment lifecycle (sales, delivery, installation, service).

Current State Verdict (Revised)
RELEASE CANDIDATE (NOT PRODUCTION-READY): The codebase and design show strong engineering work and a mature feature set, but no attached evidence (CI runs, test artifacts, security attestations, restore-drill logs, or deployment manifests) currently exists to support any claim of production readiness or external certification. All statements about SOC2/HIPAA certification or "PRODUCTION READY" must be removed or clearly qualified until attestation artifacts are provided.

Strengths
- Broad domain coverage and modular architecture (frontend/backend split, observability, test frameworks indicated).
- Explicit focus on auditability, tenant isolation, and non-functional requirements.

Critical Gaps (Summary)
- Evidence for certification, CI gate success, migration safety, restore drills, and SLO compliance is missing or not attached.
- Super Admin UX conflation and incomplete role-specific acceptance tests.

---

2. PRODUCTION READINESS GAP ANALYSIS (REVISED)

Key Immediate Requirements (evidence-driven):
- Release Truthfulness: Remove/qualify production/certification claims until signed artifacts (SOC2 report, BAA, auditor statements) are attached.
- Deployability: Provide IaC/manifested deployment artifacts, automated gelled pipelines, and documented rollback playbooks.
- Operability: Attach SLI/SLO definitions, alert rules, and incident playbooks with historical examples or drill results.
- Security Evidence: Attach SCA/SBOM, SAST/DAST/pen-test reports, secrets-scan outputs, and remediation logs.
- Data Safety: Provide migration validation scripts, forward-only policies, and restore drill logs with measured RTO/RPO.

---

3. PHASES 9–15 (SUMMARY WITH REQUIRED EXIT ARTIFACTS)

Phases are preserved as in v1.0 but every phase Exit Criteria now requires explicit artifacts uploaded to the Evidence Index (section below). No phase is "complete" without the linked artifact(s) and an owner sign-off.

Phase highlights:
- Phase 9 (Truth & Release Cleanup): README must be revised; attach docs/evidence/readme_release_status.md. Owner: Documentation Lead.
- Phase 10 (Deployability): Provide IaC + pipeline definitions; attach k8s/ or terraform/ manifests and docs/evidence/ci/latest-ci-run.log. Owner: DevOps Lead.
- Phase 11 (Data Safety & Migration Resilience): Provide drill logs and migration validation scripts; attach docs/evidence/restore_drills/*.log and hms-backend/scripts/migrations/validate_migration.sh. Owner: DB/Platform Lead.
- Phase 12 (Observability, SLOs & Incident Readiness): Attach SLI/SLO JSON and alert rules (docs/evidence/observability/*.json). Owner: Observability Lead.
- Phase 13 (Security Evidence & Tenant Isolation Proof): Attach threat model, SBOM, pen-test reports, and tenant-isolation regression suite results. Owner: Security Lead.
- Phase 14 (Compliance Packaging): Attach control matrix and BAA status. Owner: Compliance Lead.
- Phase 15 (Production Acceptance): Full staging rehearsal artifacts + signed PRR (docs/evidence/prr/*.md). Owner: Release Manager.

---

4. EVIDENCE INDEX (MUST BE POPULATED BEFORE SIGN-OFF)

Each Hard Gate listed in section 11 must point to one or more artifacts in this index. The team must populate these files and keep the index current.

Suggested artifact paths (relative to repo root):
- README and release status: README.md (root) and docs/evidence/readme_release_status.md
- CI pipeline definitions: .github/workflows/ci.yml
- Latest CI run logs: docs/evidence/ci/latest-ci-run.log
- Unit/integration/e2e test reports: docs/evidence/tests/unit/, docs/evidence/tests/integration/, docs/evidence/tests/e2e/
- Test coverage artifacts: docs/evidence/tests/coverage/index.html and coverage-summary.json
- Load/perf reports: docs/evidence/perf/loadtest-report.json
- Restore drills (timed runs): docs/evidence/restore_drills/YYYY-MM-DD-DRILL.log and summary.csv
- IaC / k8s manifests: k8s/ (all env overlays) and docker-compose.prod.yml
- Migration scripts & validation: hms-backend/prisma/schema.prisma and hms-backend/scripts/migrations/validate_migration.sh
- Observability dashboards & alert rules: docs/evidence/observability/dashboards/*.json and alerting/rules/*.yml
- Security: docs/evidence/security/sbom.json, docs/evidence/security/sast-report.json, docs/evidence/security/dast-report.json, docs/evidence/security/pentest-report.pdf, docs/evidence/security/gitleaks-report.json
- Compliance: docs/evidence/compliance/control-matrix.xlsx, docs/evidence/compliance/BAA-status.md, docs/evidence/compliance/soc2-report.pdf (if available)
- UX acceptance tests & wireframes: docs/ux/super-admin-acceptance.md and docs/ux/wireframes/super-admin/*.png
- Ownership and contact list: docs/ownership/owners.yaml and CODEOWNERS

Important: Artifact files should be referenced by exact filenames in the PR that resolves each gate.

---

5. HARD GATES & ACCEPTANCE CRITERIA (REVISED — EVIDENCE MAPPED)

(Condensed; each gate below must list the Required Artifact(s) and Owner.)

1. README contains no contradictory language.
- Required Artifact: docs/evidence/readme_release_status.md, updated README.md
- Owner: Documentation Lead

2. Every sold machine has an Asset record with installation/handover history.
- Required Artifact: sample export docs/evidence/asset-examples.csv and automated test results docs/evidence/tests/integration/asset-lifecycle-report.json
- Owner: Product/Clinical Lead

3. Monthly restore drills executed and documented (last 3 months).
- Required Artifact: docs/evidence/restore_drills/*.log + summary.csv
- Owner: DB/Platform Lead

4. SLOs defined and alerts route to on-call with incident runbook.
- Required Artifact: docs/evidence/observability/slo-definitions.json and alerting/rules/oncall-routing.yml
- Owner: Observability Lead

5. Tenant/branch isolation regression suite passes and blocks releases on failure.
- Required Artifact: docs/evidence/tests/tenant-isolation-suite/results.json and pipeline gate config .github/workflows/ci.yml
- Owner: Security Lead / QA Lead

6. Super Admin portal is governance-only; acceptance tests and wireframes exist.
- Required Artifact: docs/ux/super-admin-acceptance.md and docs/ux/wireframes/super-admin/*.png
- Owner: UX Lead

7. Step-up auth + audit for all high-risk actions.
- Required Artifact: docs/evidence/security/step-up-auth-tests.json and audit logs sample docs/evidence/audit/sample.log
- Owner: Security Lead

8. Analytics KPIs validated: SQL = API = UI for every filter combination in tests.
- Required Artifact: docs/evidence/analytics/sql_to_api_to_ui_validation/*.md and fixture tests under docs/evidence/tests/analytics/
- Owner: Analytics Lead

9. Compliance scope document exists and is reviewed.
- Required Artifact: docs/evidence/compliance/control-matrix.xlsx, docs/evidence/compliance/BAA-status.md
- Owner: Compliance Lead

10. Fresh engineer can bring up staging from docs and run smoke tests successfully.
- Required Artifact: docs/runbooks/staging_bringup.md and docs/evidence/ci/staging-smoke-run.log
- Owner: DevOps Lead

---

6. REQUIRED COMMANDS & TOOLING (CONCRETE)

Run these and save outputs in docs/evidence/security/ before requesting re-review:

- Secrets scan (recommended):
  gitleaks detect --source . --config-path .gitleaks.toml --report-format json --report-path docs/evidence/security/gitleaks-report.json --redact --exit-code 1

- NPM dependency audit (example):
  npm audit --json > docs/evidence/security/npm-audit.json

- SBOM generation (example for npm):
  cyclonedx-bom -o docs/evidence/security/sbom.json

- Migration validation (example pattern):
  hms-backend/scripts/migrations/validate_migration.sh --apply --verify > docs/evidence/migrations/validate_$(date +%F).log

Store all outputs in the Evidence Index and reference exact filenames in PRs.

---

7. SLO / SLI EXAMPLES (MUST BE TUNED)

(Provide numeric SLO targets and measurement windows when populating the Evidence Index.)
- API availability (critical path): 99.95% monthly
- API latency p50/p95: <100ms / <500ms
- RTO (critical DB restore): <= 1 hour
- RPO (acceptable data-loss): <= 30 minutes
- Mean time to acknowledge (MTTA) for P1 alerts: <= 15 minutes

---

8. MIGRATION POLICY (REQUIREMENTS)

- Forward-only migration pattern: A/B expand/contract migrations where compatible.
- Pre/post validation scripts required and must be checked into hms-backend/scripts/migrations/.
- All migrations must be executed and validated in ephemeral staging with logs attached to docs/evidence/migrations/ before production rollout.
- Rollback verification must be demonstrated as part of every migration PR.

---

9. SUPER ADMIN PORTAL — ACCEPTANCE TESTS & WIREFRAMES

- Super Admin must only show governance/control-plane actions by default (no buyer/cart actions).
- Provide wireframes and acceptance tests in docs/ux/super-admin-acceptance.md with exact pass/fail criteria and sample screenshots.

---

10. OWNERS & SIGNOFFS

Each gate requires a single owner and explicit signoff. Suggested owner file: docs/ownership/owners.yaml (example schema: gate_id, owner_name, owner_contact, signoff_file).

---

11. IMMEDIATE NEXT STEPS (TEAM PLAYBOOK)

Sprint 0 (Prepare evidence bundle)
1. Populate Evidence Index files listed above with the latest artifacts.
2. Run secret scan & SCA; remediate and rotate any secrets; update docs/evidence/security/*.
3. Execute one full restore drill and attach logs (docs/evidence/restore_drills/).
4. Add/attach smoke test and staging bring-up runbook and logs.
5. Create PRs updating README and adding the Evidence Index references; link each PR to the gate it satisfies.
6. Request Senior Engineering re-review once artifacts are attached.

Definition of Done for Release Candidate
- All hard gates in section 5 have 'Required Artifact(s)' present in docs/evidence/ and an owner signoff file; the release checklist PR includes links to artifacts and passes the CI gates defined in .github/workflows/ci.yml.

---

12. APPENDIX: QUICK CHECKLIST FOR SUBMISSIONS
- Include: CI logs, test reports, SBOM, pen-test reports, restore drill logs, migration validation logs, SLO definitions, runbooks, UX acceptance tests, owners.yaml, CODEOWNERS.
- Use exact filenames and reference them in PR descriptions.

---

CONTACTS & ROLES (TEMPLATES)
- Documentation Lead: docs-lead@EXAMPLE (replace in owners.yaml)
- DevOps Lead: devops-lead@EXAMPLE
- Security Lead: security-lead@EXAMPLE
- DB/Platform Lead: db-lead@EXAMPLE
- Observability Lead: obs-lead@EXAMPLE
- Compliance Lead: compliance-lead@EXAMPLE
- Release Manager: release-manager@EXAMPLE

(Replace placeholders in docs/ownership/owners.yaml before final sign-off.)

---

Notes
- This revision is documentation-only and designed to make acceptance evidence-first and auditable; it does not change source code.
- After populating the Evidence Index, request a Senior Engineering re-review that will be evidence-first and apply the structured verdict template.

