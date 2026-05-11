/*
  Warnings:

  - Added the required column `branch_id` to the `payslips` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payslips" ADD COLUMN     "branch_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "employee_branches" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_branches_tenant_id_idx" ON "employee_branches"("tenant_id");

-- CreateIndex
CREATE INDEX "employee_branches_employee_id_idx" ON "employee_branches"("employee_id");

-- CreateIndex
CREATE INDEX "employee_branches_branch_id_idx" ON "employee_branches"("branch_id");

-- CreateIndex
CREATE INDEX "employee_branches_tenant_id_branch_id_idx" ON "employee_branches"("tenant_id", "branch_id");

-- CreateIndex
CREATE INDEX "employee_branches_tenant_id_employee_id_idx" ON "employee_branches"("tenant_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_branches_tenant_id_employee_id_branch_id_key" ON "employee_branches"("tenant_id", "employee_id", "branch_id");

-- CreateIndex
CREATE INDEX "payslips_tenant_id_branch_id_idx" ON "payslips"("tenant_id", "branch_id");

-- CreateIndex
CREATE INDEX "payslips_tenant_id_employee_id_branch_id_idx" ON "payslips"("tenant_id", "employee_id", "branch_id");

-- AddForeignKey
ALTER TABLE "employee_branches" ADD CONSTRAINT "employee_branches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_branches" ADD CONSTRAINT "employee_branches_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_branches" ADD CONSTRAINT "employee_branches_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
