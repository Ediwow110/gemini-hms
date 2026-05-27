-- AlterTable
ALTER TABLE "lab_results" ALTER COLUMN "critical_status" DROP DEFAULT,
ALTER COLUMN "critical_status" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "branch_id" UUID;

-- CreateIndex
CREATE INDEX "sessions_branch_id_idx" ON "sessions"("branch_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "lab_results_critical_status_idx" RENAME TO "lab_results_tenant_id_is_critical_critical_status_idx";
