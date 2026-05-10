import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClaimDto, UpdateClaimStatusDto } from './dto/claims.dto';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';

@Injectable()
export class ClaimsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private numbering: NumberingService,
  ) {}

  async createClaim(tenantId: string, userId: string, dto: CreateClaimDto) {
    // 1. Generate Claim Number safely using Numbering Engine
    const claimNumber = await this.numbering.generateNumber(tenantId, 'CLAIM');

    // 2. Create Claim
    const claim = await this.prisma.claim.create({
      data: {
        tenantId,
        hmoPartnerId: dto.hmoPartnerId,
        invoiceId: dto.invoiceId,
        claimNumber,
        loaNumber: dto.loaNumber,
        amountClaimed: dto.amountClaimed,
        status: 'PENDING',
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'CLAIM_CREATED',
      recordType: 'Claim',
      recordId: claim.id,
      newValues: claim,
    });

    return claim;
  }

  async updateStatus(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateClaimStatusDto,
  ) {
    const claim = await this.prisma.claim.findFirst({
      where: { id, tenantId },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    const updated = await this.prisma.claim.update({
      where: { id },
      data: {
        status: dto.status,
        amountApproved: dto.amountApproved,
        remarks: dto.remarks,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: `CLAIM_${dto.status}`,
      recordType: 'Claim',
      recordId: id,
      newValues: updated,
    });

    return updated;
  }

  async getHmoPartners(tenantId: string) {
    return this.prisma.hmoPartner.findMany({
      where: { tenantId, status: 'ACTIVE' },
    });
  }

  async getClaims(tenantId: string) {
    return this.prisma.claim.findMany({
      where: { tenantId },
      include: {
        hmoPartner: true,
        invoice: {
          include: {
            order: { include: { patient: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
