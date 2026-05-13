-- AlterTable
ALTER TABLE "permissions"
ADD COLUMN "risk_level" TEXT NOT NULL DEFAULT 'PRIVILEGED';
