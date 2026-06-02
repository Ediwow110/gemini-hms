# Branch Hygiene Audit (BH-0)
**Repository:** https://github.com/Ediwow110/gemini-hms
**Date:** $(Get-Date -Format "yyyy-MM-dd")
**Current main SHA:** 88fd680
**Active phase:** NG-4 — Frontend Deployment Proof
**Active branch:** runtime/ng4-frontend-deployment-proof (not yet observed in remotes; local may vary)

## Executive Summary
- 133 remote branches discovered (100+ as reported).
- 25 branches already merged into origin/main.
- 108 unmerged remote branches.
- Only **1 open PR** (#97: "Phase 29: add non-GCP production evidence gates" — state OPEN, mergeState DIRTY, head: phase/29-production-evidence-gates, updated 2026-05-30).
- Working tree **DIRTY**: 
  - Modified: `hms-frontend/src/pages/clinical/ClinicalOperationsDashboard.tsx`
  - Untracked: backend.err, backend.log, docs/product/dashboard-final-report.md, frontend.log, frontend.pid, start-frontend.ps1
- **PR #97** is open and classified as REVIEW/stale. It appears superseded by recent merged NG-0–NG-3 runtime branches, multiple security/s* audits (s7–s21), and non-GCP evidence docs added to main in the latest merge (88fd680). Its DIRTY status indicates conflicts with current main.
- No branches deleted. No PRs closed. Audit-only per BH-0 rules.
- **Risks:** High branch count increases cognitive load and potential for confusion. Many old feat/fix branches from earlier phases remain.

## Key Metrics
- Total remote branches: 133
- Total local branches: 84
- Merged into main: 25
- Not merged into main: 108
- Open PRs: 1 (#97)
- Merged PRs in history: ~154

## A. SAFE DELETE Candidates (15+)
Branches merged into main, no open PRs, not active, not main:
- origin/docs/patient-merge-transactionality-accuracy
- origin/docs/phase-21-batch-1-send-readiness
- origin/docs/phase-21-outreach-record-correction
- origin/feat/service-catalog-pricing
- origin/feature/audit-viewer-docs
- origin/feature/export-approval
- ... (full list in branch-audit-remote-merged-main.txt; excludes main, ng*, phase/29*, security active branches)
Full safe list generated from `--merged origin/main`.

## B. KEEP List
- origin/main (88fd680)
- Any runtime/ng* branches (ng0-non-gcp-platform-decision, ng1-env-secret-inventory, ng2-hosted-postgres-migration-proof, ng3-backend-deployment-proof, and runtime/ng4-frontend-deployment-proof if present)
- phase/29-production-evidence-gates (tied to open PR #97)
- All branches with unmerged commits or open PRs
- Recent security/s10–s21 branches (many now appear merged or active)

## C. REVIEW / Stale List
- phase/29-production-evidence-gates (PR #97): Superseded by NG runtime track + comprehensive security audits now on main. DIRTY merge state. Old production-evidence scaffolding likely obsolete given current STAGING-ONLY verdict and non-GCP proofs.
- Numerous old feature/fix branches with unmerged commits (108 total unmerged).
- Many legacy phase branches from pre-NG-4 work.

## D. CLOSE-PR Candidates
- PR #97 only. Recommend close as superseded **only after explicit user approval**. Do not merge (DIRTY + scope overlap with recent evidence docs).

## Proposed Commands (NOT executed)
**Safe delete example (after approval):**
```bash
git push origin --delete docs/patient-merge-transactionality-accuracy
# repeat per safe branch
git branch -d <local-merged>
```

**Close PR example (after approval):**
```bash
gh pr close 97 --comment "Closing as superseded by NG-0–NG-4 runtime proofs, security/s10-s21 audits, and non-GCP evidence now on main."
```

## Non-Action Statement
**No branches deleted. No PRs closed or merged. No code or deployment changes made.** Audit complete per HARD RULES. Dirty working tree documented; recommend `git restore hms-frontend/src/pages/clinical/ClinicalOperationsDashboard.tsx` or stash before further git ops if proceeding.

## Recommendation
1. Approve deletion of **SAFE DELETE** merged branches only (re-run fetch first).
2. Review PR #97 separately — likely safe to close with comment.
3. After cleanup, resume NG-4 frontend deployment proof on dedicated runtime branch.
4. Consider protecting main and runtime/* branches.

**Awaiting user approval: “Approve deletion of SAFE DELETE branch list only?”**
**STOP POINT — BH-0 complete. Do not proceed to BH-1 without explicit approval.**
