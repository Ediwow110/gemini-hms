-- Add gateway/payment provider fields for QRPH integration
ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "gateway_reference" text,
  ADD COLUMN IF NOT EXISTS "gateway_status" text,
  ADD COLUMN IF NOT EXISTS "gateway_provider" text;

-- Index for querying gateway-pending payments
CREATE INDEX IF NOT EXISTS "payments_gateway_status_idx" ON "payments"("gateway_status");
