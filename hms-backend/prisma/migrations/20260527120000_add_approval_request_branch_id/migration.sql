-- Add explicit branch scope to approval requests so branch-bound users cannot list cross-branch requests.
ALTER TABLE "approval_requests"
ADD COLUMN "branch_id" UUID;

CREATE INDEX "approval_requests_tenant_id_branch_id_status_idx"
ON "approval_requests"("tenant_id", "branch_id", "status");
