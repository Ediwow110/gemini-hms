import { InsuranceClaim } from '@prisma/client';

export interface ClaimStatusResult {
  status: 'ACCEPTED' | 'REJECTED' | 'PAID';
  settledAmount?: number;
  rejectionReason?: string;
}

export interface InsuranceProvider {
  submitClaim(claim: InsuranceClaim): Promise<{ referenceNumber: string }>;
  checkClaimStatus(referenceNumber: string): Promise<ClaimStatusResult>;
}
