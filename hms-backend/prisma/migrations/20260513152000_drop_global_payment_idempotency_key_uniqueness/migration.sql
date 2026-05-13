-- Drop the global uniqueness on payment idempotency keys.
-- Tenant-scoped uniqueness is enforced by idempotency_records instead.
DROP INDEX IF EXISTS "payments_idempotency_key_key";
