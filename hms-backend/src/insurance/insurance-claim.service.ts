import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { AuditService } from '../audit/audit.service';
import { InsuranceClaim, Prisma } from '@prisma/client';
import type { InsuranceProvider } from './providers/insurance-provider.interface';

@Injectable()
export class InsuranceClaimService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly audit: AuditService,
    @Inject('InsuranceProvider')
    private readonly provider: InsuranceProvider,
  ) {}

  async createClaim(
    tenantId: string,
    branchId: string,
    userId: string,
    data: {
      invoiceId: string;
      providerCode: string;
      claimedAmount: number;
    },
  ): Promise<InsuranceClaim> {
    // 1. Validate invoice exists
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: data.invoiceId, tenantId },
      include: { order: true },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // 2. Validate no duplicate active claim per invoice
    const activeClaim = await this.prisma.insuranceClaim.findFirst({
      where: {
        invoiceId: data.invoiceId,
        tenantId,
        status: { in: ['DRAFT', 'SUBMITTED', 'ACCEPTED', 'PAID'] },
      },
    });
    if (activeClaim) {
      throw new ConflictException(
        'Active claim already exists for this invoice',
      );
    }

    // 3. Find patientId from order/patient
    const patientId = invoice.order.patientId;

    const claim = await this.prisma.insuranceClaim.create({
      data: {
        tenantId,
        branchId,
        invoiceId: data.invoiceId,
        patientId,
        providerCode: data.providerCode,
        status: 'DRAFT',
        claimedAmount: data.claimedAmount,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'INSURANCE_CLAIM_CREATED',
      recordType: 'InsuranceClaim',
      recordId: claim.id,
      newValues: {
        claimId: claim.id,
        invoiceId: data.invoiceId,
        branchId,
        providerCode: data.providerCode,
        claimedAmount: data.claimedAmount,
      },
    });

    return claim;
  }

  async submitClaim(
    tenantId: string,
    userId: string,
    id: string,
  ): Promise<InsuranceClaim> {
    const claim = await this.prisma.insuranceClaim.findFirst({
      where: { id, tenantId },
    });
    if (!claim) {
      throw new NotFoundException('Insurance claim not found');
    }

    // Call provider stub
    const providerResult = await this.provider.submitClaim(claim);

    const updatedClaim = await this.prisma.insuranceClaim.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        claimNumber: providerResult.referenceNumber,
        submittedAt: new Date(),
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'INSURANCE_CLAIM_SUBMITTED',
      recordType: 'InsuranceClaim',
      recordId: claim.id,
      oldValues: { status: claim.status },
      newValues: {
        status: 'SUBMITTED',
        claimNumber: providerResult.referenceNumber,
      },
    });

    return updatedClaim;
  }

  async updateClaimStatus(
    tenantId: string,
    userId: string,
    id: string,
    data: {
      status: 'ACCEPTED' | 'REJECTED' | 'PAID';
      settledAmount?: number;
      rejectionReason?: string;
    },
  ): Promise<InsuranceClaim> {
    const claim = await this.prisma.insuranceClaim.findFirst({
      where: { id, tenantId },
    });
    if (!claim) {
      throw new NotFoundException('Insurance claim not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedClaim = await tx.insuranceClaim.update({
        where: { id },
        data: {
          status: data.status,
          settledAmount:
            data.status === 'PAID' ? data.settledAmount : undefined,
          settledAt: data.status === 'PAID' ? new Date() : null,
          rejectionReason:
            data.status === 'REJECTED' ? data.rejectionReason : null,
        },
      });

      // Post LedgerEntry if PAID
      if (data.status === 'PAID') {
        const claimed = claim.claimedAmount;
        if (claimed === null || claimed === undefined) {
          throw new Error('Cannot settle claim: claimedAmount is null');
        }
        const settledAmt = data.settledAmount ?? Number(claimed);
        if (!Number.isFinite(settledAmt) || settledAmt <= 0) {
          throw new Error('Invalid settled amount');
        }
        await this.ledgerService.postEntry(
          {
            tenantId,
            branchId: claim.branchId,
            debitAccount: 'INSURANCE_RECEIVABLE',
            creditAccount: 'REVENUE',
            amount: new Prisma.Decimal(settledAmt),
            referenceType: 'CLAIM_SETTLEMENT',
            referenceId: claim.id,
            description: `Insurance claim settled for ${claim.providerCode} (Claim #${claim.claimNumber})`,
          },
          tx,
        );
      }

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'INSURANCE_CLAIM_STATUS_CHANGED',
          recordType: 'InsuranceClaim',
          recordId: claim.id,
          oldValues: { status: claim.status },
          newValues: {
            status: data.status,
            settledAmount: data.settledAmount,
            rejectionReason: data.rejectionReason,
          },
        },
        tx,
      );

      return updatedClaim;
    });
  }

  async getClaim(tenantId: string, id: string): Promise<InsuranceClaim> {
    const claim = await this.prisma.insuranceClaim.findFirst({
      where: { id, tenantId },
      include: { invoice: true, patient: true },
    });
    if (!claim) {
      throw new NotFoundException('Insurance claim not found');
    }
    return claim;
  }
}
