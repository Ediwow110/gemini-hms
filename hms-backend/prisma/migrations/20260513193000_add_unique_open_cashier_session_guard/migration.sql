-- Prevent concurrent duplicate OPEN cashier sessions for the same tenant/user/branch.
CREATE UNIQUE INDEX "cashier_sessions_one_open_per_user_branch_idx"
ON "cashier_sessions"("tenant_id", "user_id", "branch_id")
WHERE "status" = 'OPEN';
