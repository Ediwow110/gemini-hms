-- AlterTable
ALTER TABLE "clinical_notes" ALTER COLUMN "created_by" DROP DEFAULT,
ALTER COLUMN "updated_by" DROP DEFAULT;

-- AlterTable
ALTER TABLE "diagnoses" ALTER COLUMN "created_by" DROP DEFAULT;

-- AlterTable
ALTER TABLE "encounters" ALTER COLUMN "created_by" DROP DEFAULT,
ALTER COLUMN "updated_by" DROP DEFAULT;

-- AlterTable
ALTER TABLE "vitals" ALTER COLUMN "created_by" DROP DEFAULT;

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "is_mfa_verified" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_rotated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_tenant_id_idx" ON "sessions"("tenant_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
