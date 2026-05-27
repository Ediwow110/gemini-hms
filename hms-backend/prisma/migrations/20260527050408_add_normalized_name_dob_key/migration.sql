/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,normalized_name_dob_key]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "normalized_name_dob_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "patients_tenant_id_normalized_name_dob_key_key" ON "patients"("tenant_id", "normalized_name_dob_key");
