import { Injectable } from '@nestjs/common';
import { InsuranceClaim } from '@prisma/client';
import {
  InsuranceProvider,
  ClaimStatusResult,
} from './insurance-provider.interface';

@Injectable()
export class StubInsuranceProvider implements InsuranceProvider {
  async submitClaim(
    _claim: InsuranceClaim,
  ): Promise<{ referenceNumber: string }> {
    return {
      referenceNumber: `REF-PH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
  }

  async checkClaimStatus(_referenceNumber: string): Promise<ClaimStatusResult> {
    return {
      status: 'ACCEPTED',
    };
  }
}
