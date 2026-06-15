-- Drop existing FK constraints safely (ignore if name differs)
ALTER TABLE IF EXISTS "role_permissions" DROP CONSTRAINT IF EXISTS "role_permissions_permission_id_fkey";
ALTER TABLE IF EXISTS "role_permissions" DROP CONSTRAINT IF EXISTS "role_permissions_role_id_fkey";
ALTER TABLE IF EXISTS "notification_outbox" DROP CONSTRAINT IF EXISTS "notification_outbox_recipient_id_fkey";
ALTER TABLE IF EXISTS "notification_outbox" DROP CONSTRAINT IF EXISTS "notification_outbox_tenant_id_fkey";

-- DropIndex (cleanup pre-existing drift)
DROP INDEX IF EXISTS "payments_gateway_status_idx";

-- AlterTable: add tenant_id as nullable to notification_outbox
ALTER TABLE "notification_outbox" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;

-- AlterTable: migrate user_roles from composite PK to surrogate ID
ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "user_roles_pkey";
ALTER TABLE "user_roles" ADD COLUMN IF NOT EXISTS "id" UUID;
UPDATE "user_roles" SET "id" = gen_random_uuid() WHERE "id" IS NULL;
ALTER TABLE "user_roles" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");

-- CreateIndex (safe: IF NOT EXISTS not supported, use CONCURRENTLY outside tx)
CREATE INDEX IF NOT EXISTS "cashier_ledger_entries_cashier_session_id_idx" ON "cashier_ledger_entries"("cashier_session_id");
CREATE INDEX IF NOT EXISTS "cashier_ledger_entries_type_idx" ON "cashier_ledger_entries"("type");
CREATE INDEX IF NOT EXISTS "cashier_ledger_entries_reference_id_idx" ON "cashier_ledger_entries"("reference_id");
CREATE INDEX IF NOT EXISTS "notification_outbox_tenant_id_idx" ON "notification_outbox"("tenant_id");
CREATE INDEX IF NOT EXISTS "notification_outbox_recipient_id_idx" ON "notification_outbox"("recipient_id");
CREATE INDEX IF NOT EXISTS "notification_outbox_status_scheduled_at_idx" ON "notification_outbox"("status", "scheduled_at");

-- CreateUniqueIndex (safe: IF NOT EXISTS not supported, will error if exists)
CREATE UNIQUE INDEX IF NOT EXISTS "payslips_tenant_id_employee_id_period_start_period_end_key" ON "payslips"("tenant_id", "employee_id", "period_start", "period_end");
CREATE UNIQUE INDEX IF NOT EXISTS "roles_tenant_id_name_key" ON "roles"("tenant_id", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- AddForeignKey: notification_outbox
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: role_permissions with CASCADE
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
