-- Migration: bind_payments_to_cashier_session_tenant_branch
-- Forward-only.
--
-- Closes the remaining ownership gap that 20260615120000 left open:
-- that migration bound payment_voids and refunds to the composite
-- (tenant_id, payment_id, branch_id) key on payments, but it did
-- not bind payments to a cashier session that is consistent with
-- payment.tenant_id and payment.branch_id. The single-column
-- payments.cashier_session_id -> cashier_sessions.id FK still
-- allowed a payment to reference a session in a different tenant
-- or branch.
--
-- This migration makes the cashier-session FK a composite FK
-- (tenant_id, cashier_session_id, branch_id) ->
-- cashier_sessions(tenant_id, id, branch_id) so the database
-- refuses any insert or update where payment.tenant_id,
-- payment.cashier_session_id, and payment.branch_id do not all
-- point at the same cashier session.
--
-- Forward-only. No automatic rollback. If you must roll back, do
-- it manually and only after stopping all writes.
-- ============================================================

-- ============================================================
-- SECTION A: Preflight — detect existing tenant and branch
-- mismatches between payments and their owning cashier sessions.
-- ============================================================
DO $$
DECLARE
  tenant_mismatch_count INT;
  branch_mismatch_count INT;
  orphan_count          INT;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM "payments" p
  LEFT JOIN "cashier_sessions" cs ON cs.id = p.cashier_session_id
  WHERE cs.id IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Preflight FAILED: % payments reference a non-existent cashier session', orphan_count;
  END IF;

  SELECT COUNT(*) INTO tenant_mismatch_count
  FROM "payments" p
  JOIN "cashier_sessions" cs ON cs.id = p.cashier_session_id
  WHERE p.tenant_id IS DISTINCT FROM cs.tenant_id;
  IF tenant_mismatch_count > 0 THEN
    RAISE EXCEPTION 'Preflight FAILED: % payments have tenant_id != cashier_session.tenant_id', tenant_mismatch_count;
  END IF;

  SELECT COUNT(*) INTO branch_mismatch_count
  FROM "payments" p
  JOIN "cashier_sessions" cs ON cs.id = p.cashier_session_id
  WHERE p.branch_id IS DISTINCT FROM cs.branch_id;
  IF branch_mismatch_count > 0 THEN
    RAISE EXCEPTION 'Preflight FAILED: % payments have branch_id != cashier_session.branch_id', branch_mismatch_count;
  END IF;
END $$;

-- ============================================================
-- SECTION B: Add the composite unique key on
-- cashier_sessions(tenant_id, id, branch_id) that the composite
-- FK will reference.
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS "cashier_sessions_tenant_id_id_branch_id_key"
  ON "cashier_sessions"("tenant_id", "id", "branch_id");

-- ============================================================
-- SECTION C: Drop the old single-column FK from payments to
-- cashier_sessions and replace it with a composite FK that
-- enforces tenant and branch ownership at the database level.
-- ============================================================
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_cashier_session_id_fkey";

ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_cashier_session_id_branch_id_fkey"
  FOREIGN KEY ("tenant_id", "cashier_session_id", "branch_id")
  REFERENCES "cashier_sessions"("tenant_id", "id", "branch_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
