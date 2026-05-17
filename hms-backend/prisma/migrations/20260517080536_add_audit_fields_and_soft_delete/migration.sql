/*
  Warnings:

  - Added the required column `updated_at` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "clinical_notes" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_by_id" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "lab_results" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_by_id" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_by_id" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_by_id" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_by_id" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "prescriptions" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_by_id" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "referrals" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_by_id" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;
