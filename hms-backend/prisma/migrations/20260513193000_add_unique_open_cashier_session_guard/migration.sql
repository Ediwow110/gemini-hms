-- Prevent concurrent duplicate OPEN cashier sessions for the same tenant/user/branch.
--
-- Existing deployments may already contain duplicate OPEN sessions because the
-- old implementation was only read-then-create. We do not auto-close or delete
-- those rows here because that could falsify cashier history or reconciliation
-- state. Instead, fail with an explicit remediation plan before adding the
-- partial unique index.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "cashier_sessions"
    WHERE "status" = 'OPEN'
    GROUP BY "tenant_id", "user_id", "branch_id"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Duplicate OPEN cashier sessions exist; resolve them before applying cashier_sessions_one_open_per_user_branch_idx.'
      USING HINT =
        'Identify duplicates with: SELECT tenant_id, user_id, branch_id, COUNT(*) FROM cashier_sessions WHERE status = ''OPEN'' GROUP BY tenant_id, user_id, branch_id HAVING COUNT(*) > 1; '
        'Then, for each duplicate group, keep the correct active session OPEN and update the other rows to a terminal status with closed_at set based on an operator-reviewed remediation plan before rerunning this migration.';
  END IF;
END $$;

CREATE UNIQUE INDEX "cashier_sessions_one_open_per_user_branch_idx"
ON "cashier_sessions"("tenant_id", "user_id", "branch_id")
WHERE "status" = 'OPEN';
