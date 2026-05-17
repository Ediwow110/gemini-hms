-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "active_role" TEXT,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "session_id" UUID,
ADD COLUMN     "user_agent" TEXT;
