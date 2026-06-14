-- Migration: enforce_branch_financial_ownership
-- Forward-only.
-- Adds branch_id to payments and enforces branch consistency for
-- payment_voids and refunds at the database level.
--
-- NOTE about the preceding migration (20260615020000):
-- System actor password hashes use SHA-512 crypt format ($6$ prefix),
-- NOT bcrypt ($2b$ prefix). The hash is intentionally unusable:
-- auth guards check isSystem before password comparison, so even a
-- valid hash would be rejected for interactive login.
-- ============================================================

-- SECTION A: Preflight — detect branch mismatches before altering FKs
-- ============================================================
DO $$
DECLARE
  mismatch_count INT;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM "payment_voids" pv
  JOIN "payments" p ON p.id = pv.payment_id
  JOIN "cashier_sessions" cs ON cs.id = p.cashier_session_id
  WHERE pv.branch_id != cs.branch_id;
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'Preflight FAILED: % payment_voids branch_id != cashier_session.branch_id', mismatch_count;
  END IF;

  SELECT COUNT(*) INTO mismatch_count
  FROM "refunds" r
  JOIN "payments" p ON p.id = r.payment_id
  JOIN "cashier_sessions" cs ON cs.id = p.cashier_session_id
  WHERE r.branch_id != cs.branch_id;
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'Preflight FAILED: % refunds branch_id != cashier_session.branch_id', mismatch_count;
  END IF;
END $$;

-- ============================================================
-- SECTION B: Add branch_id to payments table
-- ============================================================
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "branch_id" UUID;

-- Backfill branch_id from the owning cashier session
UPDATE "payments" p
SET "branch_id" = cs.branch_id
FROM "cashier_sessions" cs
WHERE cs.id = p.cashier_session_id
  AND p.branch_id IS NULL;

-- Protect against orphan payments without a session
DO $$
DECLARE
  orphan_count INT;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM "payments" WHERE "branch_id" IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Preflight FAILED: % payments have no cashier session to derive branch_id', orphan_count;
  END IF;
END $$;

ALTER TABLE "payments" ALTER COLUMN "branch_id" SET NOT NULL;

-- ============================================================
-- SECTION C: Composite unique key for triple-compound FK
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS "payments_tenant_id_id_branch_id_key"
  ON "payments"("tenant_id", "id", "branch_id");

-- ============================================================
-- SECTION D: Upgrade child FKs to include branch enforcement
-- ============================================================
ALTER TABLE "payment_voids" DROP CONSTRAINT IF EXISTS "payment_voids_payment_id_fkey";

ALTER TABLE "payment_voids" ADD CONSTRAINT "payment_voids_payment_id_fkey"
  FOREIGN KEY ("tenant_id", "payment_id", "branch_id")
  REFERENCES "payments"("tenant_id", "id", "branch_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refunds" DROP CONSTRAINT IF EXISTS "refunds_payment_id_fkey";

ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey"
  FOREIGN KEY ("tenant_id", "payment_id", "branch_id")
  REFERENCES "payments"("tenant_id", "id", "branch_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
