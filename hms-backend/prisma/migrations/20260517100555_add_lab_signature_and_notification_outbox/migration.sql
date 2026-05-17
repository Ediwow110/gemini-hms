-- CreateTable
CREATE TABLE "lab_result_signatures" (
    "id" UUID NOT NULL,
    "lab_result_id" UUID NOT NULL,
    "signed_by_id" UUID NOT NULL,
    "signed_at" TIMESTAMP(3) NOT NULL,
    "signature_hash" TEXT NOT NULL,

    CONSTRAINT "lab_result_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_outbox" (
    "id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "notification_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lab_result_signatures_lab_result_id_key" ON "lab_result_signatures"("lab_result_id");

-- AddForeignKey
ALTER TABLE "lab_result_signatures" ADD CONSTRAINT "lab_result_signatures_lab_result_id_fkey" FOREIGN KEY ("lab_result_id") REFERENCES "lab_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
