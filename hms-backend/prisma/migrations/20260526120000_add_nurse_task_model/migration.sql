-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "nurse_tasks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "patient_id" UUID,
    "assigned_user_id" UUID,
    "created_by_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "completed_by_id" UUID,
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by_id" UUID,
    "cancellation_reason" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nurse_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nurse_tasks_tenant_id_branch_id_status_idx" ON "nurse_tasks"("tenant_id", "branch_id", "status");

-- CreateIndex
CREATE INDEX "nurse_tasks_tenant_id_assigned_user_id_status_idx" ON "nurse_tasks"("tenant_id", "assigned_user_id", "status");

-- CreateIndex
CREATE INDEX "nurse_tasks_tenant_id_patient_id_idx" ON "nurse_tasks"("tenant_id", "patient_id");

-- CreateIndex
CREATE INDEX "nurse_tasks_due_at_idx" ON "nurse_tasks"("due_at");

-- AddForeignKey
ALTER TABLE "nurse_tasks" ADD CONSTRAINT "nurse_tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurse_tasks" ADD CONSTRAINT "nurse_tasks_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurse_tasks" ADD CONSTRAINT "nurse_tasks_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurse_tasks" ADD CONSTRAINT "nurse_tasks_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurse_tasks" ADD CONSTRAINT "nurse_tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurse_tasks" ADD CONSTRAINT "nurse_tasks_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurse_tasks" ADD CONSTRAINT "nurse_tasks_cancelled_by_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
