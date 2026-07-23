-- AddCompositeIndexes
-- Adds composite indexes for common query patterns on ApprovalRequest and PatientMergeRequest

-- ApprovalRequest: cover "pending by type" queries (tenantId, status, type)
CREATE INDEX "approval_requests_tenantId_status_type_idx" ON "approval_requests" ("tenant_id", "status", "type");

-- PatientMergeRequest: replace individual tenantId and status indexes with composite
DROP INDEX IF EXISTS "patient_merge_requests_tenantId_idx";
DROP INDEX IF EXISTS "patient_merge_requests_status_idx";
CREATE INDEX "patient_merge_requests_tenantId_status_idx" ON "patient_merge_requests" ("tenant_id", "status");
