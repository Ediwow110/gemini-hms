-- AlterTable
ALTER TABLE "users"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "deactivated_at" TIMESTAMP(3),
ADD COLUMN "deactivated_reason" TEXT,
ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "roles"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "archived_at" TIMESTAMP(3),
ADD COLUMN "archived_reason" TEXT;
