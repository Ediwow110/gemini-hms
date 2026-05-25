-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "supplier_id" UUID;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "supplier_id" UUID;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
