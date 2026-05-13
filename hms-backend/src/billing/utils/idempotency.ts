import { createHash } from 'crypto';
import { CreatePaymentDto } from '../dto/payment.dto';

/**
 * Compute a stable fingerprint for a payment request.
 *
 * Fingerprint includes:
 * - invoiceId
 * - cashierSessionId
 * - amount
 * - paymentMethod
 *
 * Does NOT include:
 * - Idempotency-Key header value (that is the lookup key, not part of the fingerprint)
 * - timestamps or volatile data
 *
 * This ensures the fingerprint is stable for semantically identical requests,
 * and changes if the actual payment parameters differ.
 */
export function computePaymentFingerprint(
  tenantId: string,
  operation: string,
  dto: CreatePaymentDto,
): string {
  const normalized = {
    tenantId, // Scope: different tenants are independent
    operation, // Scope: different operations are independent
    invoiceId: dto.invoiceId,
    cashierSessionId: dto.cashierSessionId,
    amount: dto.amount.toString(), // Normalize Decimal to string
    paymentMethod: dto.paymentMethod,
  };

  const payload = JSON.stringify(normalized);
  return createHash('sha256').update(payload).digest('hex');
}
