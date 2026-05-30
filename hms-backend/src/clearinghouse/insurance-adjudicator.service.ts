import { Injectable, ForbiddenException, Logger } from '@nestjs/common';

export interface PolicyToken {
  id: string;
  tenantId: string;
  coverageRatio: number; // R_coverage (e.g. 0.80 for 80% coverage)
  lifetimeCap: number; // L_cap (e.g. 50000)
  deductible: number; // D_deductible (e.g. 200)
  excludedIcd10: string[];
}

export interface AdjudicationResult {
  invoiceId: string;
  tenantId: string;
  payoutAdjusted: number;
  originalCost: number;
  coverageApplied: number;
  capApplied: number;
  deductibleApplied: number;
  adjudicationStatus:
    | 'APPROVED_FULL'
    | 'APPROVED_PARTIAL'
    | 'DENIED_BY_POLICY_RULE';
  remarks: string;
}

@Injectable()
export class InsuranceAdjudicatorService {
  private readonly logger = new Logger(InsuranceAdjudicatorService.name);

  /**
   * Adjudicates clinical claims based on strict ICD-10 parsing and policy parameters
   */
  async adjudicateClaim(
    invoiceId: string,
    icd10Codes: string[],
    policyToken: PolicyToken,
    claimCost: number,
    invoiceTenantId: string,
  ): Promise<AdjudicationResult> {
    this.logger.log(
      `Adjudicating insurance claim for Invoice ${invoiceId} under Tenant: ${invoiceTenantId}`,
    );

    // 1. Multi-Tenant Isolation Rule
    if (policyToken.tenantId !== invoiceTenantId) {
      this.logger.error(
        `🚨 [TENANT_MISMATCH] Policy Tenant [${policyToken.tenantId}] doesn't match Invoice Tenant [${invoiceTenantId}]`,
      );
      throw new ForbiddenException(
        'Security Exception: Multi-tenant tenantId namespace boundary breach detected!',
      );
    }

    let coverageRatio = policyToken.coverageRatio;
    let status: 'APPROVED_FULL' | 'APPROVED_PARTIAL' | 'DENIED_BY_POLICY_RULE' =
      'APPROVED_FULL';
    let remarks = 'Claim successfully adjudicated and approved.';

    // 2. Parse raw ICD-10 diagnostics to inspect pre-existing exclusions
    for (const code of icd10Codes) {
      if (policyToken.excludedIcd10.includes(code)) {
        this.logger.warn(
          `⚠️ [POLICY_EXCLUSION] Diagnostic code ${code} matches pre-existing exclusion policy. Coverage dropped to 0.00.`,
        );
        coverageRatio = 0.0;
        status = 'DENIED_BY_POLICY_RULE';
        remarks = `Adjudication Denied: Diagnostic code ${code} is explicitly excluded in policy.`;
        break;
      }
    }

    // 3. Payout Split Equation: P_adjusted = max(0, min(C_claim * R_coverage, L_cap) - D_deductible)
    const rawCoveredCost = claimCost * coverageRatio;
    const cappedCost = Math.min(rawCoveredCost, policyToken.lifetimeCap);
    const payoutAdjusted = Math.max(0, cappedCost - policyToken.deductible);

    const precisionPayout = parseFloat(payoutAdjusted.toFixed(2));

    if (precisionPayout > 0 && status !== 'DENIED_BY_POLICY_RULE') {
      status =
        precisionPayout < claimCost ? 'APPROVED_PARTIAL' : 'APPROVED_FULL';
    }

    this.logger.log(
      `Adjudication completed: Final Payout: ₱${precisionPayout.toFixed(2)} | Status: ${status}`,
    );

    return {
      invoiceId,
      tenantId: invoiceTenantId,
      payoutAdjusted: precisionPayout,
      originalCost: claimCost,
      coverageApplied: coverageRatio,
      capApplied: cappedCost,
      deductibleApplied: policyToken.deductible,
      adjudicationStatus: status,
      remarks,
    };
  }
}
