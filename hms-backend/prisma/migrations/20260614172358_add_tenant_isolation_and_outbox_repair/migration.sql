-- 1. Preflight check: abort if any unresolved orphan records exist
DO $$
DECLARE
  orphan_outbox_count INT;
  orphan_void_count INT;
  orphan_refund_count INT;
  orphan_ledger_count INT;
BEGIN
  -- Count unresolved notification_outbox
  -- A notification_outbox is unresolved if its tenant_id is null and recipient_id does not exist in patients
  SELECT COUNT(*) INTO orphan_outbox_count
  FROM "notification_outbox" no
  LEFT JOIN "patients" p ON p.id = no.recipient_id
  WHERE (no.tenant_id IS NULL AND p.tenant_id IS NULL);

  -- Count unresolved payment_voids
  -- A payment_void is unresolved if the corresponding payment doesn't exist,
  -- or if the payment's cashier session doesn't exist
  SELECT COUNT(*) INTO orphan_void_count
  FROM "payment_voids" pv
  LEFT JOIN "payments" p ON p.id = pv.payment_id
  LEFT JOIN "cashier_sessions" cs ON cs.id = p.cashier_session_id
  WHERE p.id IS NULL OR cs.id IS NULL;

  -- Count unresolved refunds
  -- A refund is unresolved if the corresponding payment doesn't exist,
  -- or if the payment's cashier session doesn't exist
  SELECT COUNT(*) INTO orphan_refund_count
  FROM "refunds" r
  LEFT JOIN "payments" p ON p.id = r.payment_id
  LEFT JOIN "cashier_sessions" cs ON cs.id = p.cashier_session_id
  WHERE p.id IS NULL OR cs.id IS NULL;

  -- Count unresolved cashier_ledger_entries
  -- A cashier_ledger_entry is unresolved if the corresponding cashier session doesn't exist
  SELECT COUNT(*) INTO orphan_ledger_count
  FROM "cashier_ledger_entries" cle
  LEFT JOIN "cashier_sessions" cs ON cs.id = cle.cashier_session_id
  WHERE cs.id IS NULL;

  IF orphan_outbox_count > 0 OR orphan_void_count > 0 OR orphan_refund_count > 0 OR orphan_ledger_count > 0 THEN
    RAISE EXCEPTION 'Migration preflight check failed: Unresolved orphan records found. notification_outbox orphans: %, payment_voids orphans: %, refunds orphans: %, cashier_ledger_entries orphans: %', orphan_outbox_count, orphan_void_count, orphan_refund_count, orphan_ledger_count;
  END IF;
END $$;

-- 2. Drop existing foreign keys that we need to recreate
ALTER TABLE "notification_outbox" DROP CONSTRAINT IF EXISTS "notification_outbox_recipient_id_fkey";
ALTER TABLE "notification_outbox" DROP CONSTRAINT IF EXISTS "notification_outbox_tenant_id_fkey";
ALTER TABLE "payment_voids" DROP CONSTRAINT IF EXISTS "payment_voids_payment_id_fkey";
ALTER TABLE "refunds" DROP CONSTRAINT IF EXISTS "refunds_invoice_id_fkey";
ALTER TABLE "refunds" DROP CONSTRAINT IF EXISTS "refunds_payment_id_fkey";
ALTER TABLE "cashier_ledger_entries" DROP CONSTRAINT IF EXISTS "cashier_ledger_entries_cashier_session_id_fkey";

-- 3. Add columns as nullable first
ALTER TABLE "payment_voids" ADD COLUMN IF NOT EXISTS "branch_id" UUID;
ALTER TABLE "payment_voids" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "branch_id" UUID;
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;
ALTER TABLE "cashier_ledger_entries" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;

-- 4. Deterministic backfills from parent relationships
-- Backfill notification_outbox tenant_id from patients table
UPDATE "notification_outbox" no
SET "tenant_id" = p.tenant_id
FROM "patients" p
WHERE p.id = no.recipient_id AND no.tenant_id IS NULL;

-- Backfill payment_voids tenant_id and branch_id
UPDATE "payment_voids" pv
SET "tenant_id" = p.tenant_id,
    "branch_id" = cs.branch_id
FROM "payments" p
JOIN "cashier_sessions" cs ON cs.id = p.cashier_session_id
WHERE p.id = pv.payment_id AND (pv.tenant_id IS NULL OR pv.branch_id IS NULL);

-- Backfill refunds tenant_id and branch_id
UPDATE "refunds" r
SET "tenant_id" = p.tenant_id,
    "branch_id" = cs.branch_id
FROM "payments" p
JOIN "cashier_sessions" cs ON cs.id = p.cashier_session_id
WHERE p.id = r.payment_id AND (r.tenant_id IS NULL OR r.branch_id IS NULL);

-- Backfill cashier_ledger_entries tenant_id
UPDATE "cashier_ledger_entries" cle
SET "tenant_id" = cs.tenant_id
FROM "cashier_sessions" cs
WHERE cs.id = cle.cashier_session_id AND cle.tenant_id IS NULL;

-- 5. Set NOT NULL constraints
ALTER TABLE "notification_outbox" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "payment_voids" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "payment_voids" ALTER COLUMN "branch_id" SET NOT NULL;
ALTER TABLE "refunds" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "refunds" ALTER COLUMN "branch_id" SET NOT NULL;
ALTER TABLE "cashier_ledger_entries" ALTER COLUMN "tenant_id" SET NOT NULL;

-- 6. Create Indexes and unique constraints
ALTER TABLE "patients" ADD CONSTRAINT "patients_tenant_id_id_key" UNIQUE ("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "cashier_ledger_entries_tenant_id_idx" ON "cashier_ledger_entries"("tenant_id");
CREATE INDEX IF NOT EXISTS "payment_voids_tenant_id_idx" ON "payment_voids"("tenant_id");
CREATE INDEX IF NOT EXISTS "payment_voids_tenant_id_branch_id_idx" ON "payment_voids"("tenant_id", "branch_id");
CREATE INDEX IF NOT EXISTS "refunds_tenant_id_idx" ON "refunds"("tenant_id");
CREATE INDEX IF NOT EXISTS "refunds_tenant_id_branch_id_idx" ON "refunds"("tenant_id", "branch_id");

-- 7. Add Foreign Keys with Restrict delete behavior
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_recipient_id_fkey"
  FOREIGN KEY ("tenant_id", "recipient_id") REFERENCES "patients"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payment_voids" ADD CONSTRAINT "payment_voids_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payment_voids" ADD CONSTRAINT "payment_voids_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payment_voids" ADD CONSTRAINT "payment_voids_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refunds" ADD CONSTRAINT "refunds_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refunds" ADD CONSTRAINT "refunds_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refunds" ADD CONSTRAINT "refunds_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cashier_ledger_entries" ADD CONSTRAINT "cashier_ledger_entries_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cashier_ledger_entries" ADD CONSTRAINT "cashier_ledger_entries_cashier_session_id_fkey"
  FOREIGN KEY ("cashier_session_id") REFERENCES "cashier_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
