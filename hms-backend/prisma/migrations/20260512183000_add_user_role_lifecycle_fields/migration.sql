-- AlterTable
ALTER TABLE "user_roles"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "revoked_at" TIMESTAMP(3),
ADD COLUMN "revoked_reason" TEXT;
