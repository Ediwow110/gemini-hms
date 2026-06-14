-- Migration: add_system_actors_and_composite_financial_fks
-- Forward-only.
-- 1. Backfills non-interactive system actors for all tenants
-- 2. Adds composite unique keys for financial ownership enforcement
-- 3. Upgrades child FKs to composite (tenant_id, child_id) references

-- ============================================================
-- SECTION A: Preflight — detect cross-tenant data mismatches
-- ============================================================
DO $$
DECLARE
  mismatch_count INT;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM "payment_voids" pv
  JOIN "payments" p ON p.id = pv.payment_id
  WHERE pv.tenant_id != p.tenant_id;
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'Preflight FAILED: % payment_voids tenant_id != payment.tenant_id', mismatch_count;
  END IF;

  SELECT COUNT(*) INTO mismatch_count
  FROM "refunds" r
  JOIN "payments" p ON p.id = r.payment_id
  WHERE r.tenant_id != p.tenant_id;
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'Preflight FAILED: % refunds tenant_id != payment.tenant_id', mismatch_count;
  END IF;

  SELECT COUNT(*) INTO mismatch_count
  FROM "refunds" r
  JOIN "invoices" i ON i.id = r.invoice_id
  WHERE r.tenant_id != i.tenant_id;
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'Preflight FAILED: % refunds tenant_id != invoice.tenant_id', mismatch_count;
  END IF;

  SELECT COUNT(*) INTO mismatch_count
  FROM "cashier_ledger_entries" cle
  JOIN "cashier_sessions" cs ON cs.id = cle.cashier_session_id
  WHERE cle.tenant_id != cs.tenant_id;
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'Preflight FAILED: % cashier_ledger_entries tenant_id != session.tenant_id', mismatch_count;
  END IF;
END $$;

-- ============================================================
-- SECTION B: Composite unique keys on parent tables
--          Required for composite FK references
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS "payments_tenant_id_id_key"
  ON "payments"("tenant_id", "id");

CREATE UNIQUE INDEX IF NOT EXISTS "invoices_tenant_id_id_key"
  ON "invoices"("tenant_id", "id");

CREATE UNIQUE INDEX IF NOT EXISTS "cashier_sessions_tenant_id_id_key"
  ON "cashier_sessions"("tenant_id", "id");

-- ============================================================
-- SECTION B2: Add is_system column to users table
-- ============================================================
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_system" BOOLEAN NOT NULL DEFAULT false;

-- Enforce one system actor per tenant (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS "users_one_system_actor_per_tenant"
  ON "users"("tenant_id") WHERE "is_system" = true;

-- ============================================================
-- SECTION C: Backfill system actors for every tenant
-- Each tenant gets exactly one non-interactive actor:
--   isSystem=true, status='DISABLED', random uuid, random bcrypt hash
-- ============================================================
DO $$
DECLARE
  tenant_rec RECORD;
  actor_id UUID;
  random_hash TEXT;
  email_val TEXT;
BEGIN
  FOR tenant_rec IN SELECT id FROM "tenants" LOOP
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM "users" WHERE "tenant_id" = tenant_rec.id AND "is_system" = true
    );

    actor_id := gen_random_uuid();
    -- Generate an unusable hash using built-in md5 (no pgcrypto dependency)
    random_hash := '$6$system$' || md5(gen_random_uuid()::text || clock_timestamp()::text);
    email_val := 'system@' || substring(md5(tenant_rec.id::text), 1, 12) || '.hms.local';

    INSERT INTO "users" (
      "id", "tenant_id", "email", "password_hash",
      "is_system", "status", "is_mfa_enabled",
      "token_version", "failed_login_attempts",
      "created_at", "updated_at"
    ) VALUES (
      actor_id, tenant_rec.id, email_val, random_hash,
      true, 'DISABLED', false,
      0, 0,
      NOW(), NOW()
    );
  END LOOP;
END $$;

-- ============================================================
-- SECTION D: Upgrade child FKs to composite references
-- Replace individual (payment_id, invoice_id, session_id) FKs
-- with composite (tenant_id, child_id) FKs for DB-level
-- tenant consistency enforcement.
-- ============================================================
ALTER TABLE "payment_voids" DROP CONSTRAINT IF EXISTS "payment_voids_payment_id_fkey";
ALTER TABLE "refunds" DROP CONSTRAINT IF EXISTS "refunds_payment_id_fkey";
ALTER TABLE "refunds" DROP CONSTRAINT IF EXISTS "refunds_invoice_id_fkey";
ALTER TABLE "cashier_ledger_entries" DROP CONSTRAINT IF EXISTS "cashier_ledger_entries_cashier_session_id_fkey";

ALTER TABLE "payment_voids" ADD CONSTRAINT "payment_voids_payment_id_fkey"
  FOREIGN KEY ("tenant_id", "payment_id")
  REFERENCES "payments"("tenant_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey"
  FOREIGN KEY ("tenant_id", "payment_id")
  REFERENCES "payments"("tenant_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refunds" ADD CONSTRAINT "refunds_invoice_id_fkey"
  FOREIGN KEY ("tenant_id", "invoice_id")
  REFERENCES "invoices"("tenant_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cashier_ledger_entries" ADD CONSTRAINT "cashier_ledger_entries_cashier_session_id_fkey"
  FOREIGN KEY ("tenant_id", "cashier_session_id")
  REFERENCES "cashier_sessions"("tenant_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
