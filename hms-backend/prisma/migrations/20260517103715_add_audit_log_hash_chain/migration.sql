-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "hash" CHAR(64),
ADD COLUMN     "previous_hash" CHAR(64),
ADD COLUMN     "signature" TEXT;
