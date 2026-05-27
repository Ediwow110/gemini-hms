import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClaimDto, UpdateClaimStatusDto } from './dto/claims.dto';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import type { RequestUser } from '../common/types/authenticated-request.type';

const CLAIM_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['SUBMITTED', 'DENIED'],
  SUBMITTED: ['APPROVED', 'DENIED'],
  APPROVED: ['PAID'],
  DENIED: [],
  PAID: [],
};

@Injectable()
export class ClaimsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private numbering: NumberingService,
  ) {}

  private isSuperAdmin(user: RequestUser) {
    return user.roles?.includes('Super Admin') ?? false;
  }

  private assertTenant(user: RequestUser, tenantId: string) {
    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('access_denied: tenant_isolation_violation');
    }
  }

  private assertBranchContext(user: RequestUser) {
    if (!this.isSuperAdmin(user) && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }
  }

  private assertBranchAccess(user: RequestUser, targetBranchId: string) {
    if (this.isSuperAdmin(user)) {
      return;
    }
    if (!user.branchId || user.branchId !== targetBranchId) {
      throw new NotFoundException('Claim not found');
    }
  }

  async createClaim(tenantId: string, user: RequestUser, dto: CreateClaimDto) {
    this.assertTenant(user, tenantId);
    this.assertBranchContext(user);

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: {
          id: dto.invoiceId,
          tenantId,
          deletedAt: null,
        },
        include: {
          order: {
            select: {
              id: true,
              branchId: true,
              patientId: true,
            },
          },
        },
      });

      if (!invoice) {
        throw new NotFoundException('invoice_not_found');
      }

      this.assertBranchAccess(user, invoice.order.branchId);

      const hmoPartner = await tx.hmoPartner.findFirst({
        where: {
          id: dto.hmoPartnerId,
          tenantId,
          status: 'ACTIVE',
        },
      });

      if (!hmoPartner) {
        throw new NotFoundException('hmo_partner_not_found');
      }

      const invoiceAmount = Number(invoice.totalAmount);
      if (Number(dto.amountClaimed) !== invoiceAmount) {
        throw new BadRequestException(
          'claim_amount_mismatch: amountClaimed must match the invoice total',
        );
      }

      const claimNumber = await this.numbering.generateNumber(
        tenantId,
        'CLAIM',
        undefined,
        tx,
      );

      const claim = await tx.claim.create({
        data: {
          tenantId,
          hmoPartnerId: hmoPartner.id,
          invoiceId: invoice.id,
          claimNumber,
          loaNumber: dto.loaNumber,
          amountClaimed: invoice.totalAmount,
          status: 'PENDING',
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'CLAIM_CREATED',
          recordType: 'Claim',
          recordId: claim.id,
          newValues: {
            claimNumber,
            invoiceId: invoice.id,
            branchId: invoice.order.branchId,
            hmoPartnerId: hmoPartner.id,
            amountClaimed: invoiceAmount,
          },
        },
        tx,
        invoice.order.branchId,
      );

      return claim;
    });
  }

  async updateStatus(
    tenantId: string,
    user: RequestUser,
    id: string,
    dto: UpdateClaimStatusDto,
  ) {
    this.assertTenant(user, tenantId);
    this.assertBranchContext(user);

    const claim = await this.prisma.claim.findFirst({
      where: { id, tenantId },
      include: {
        invoice: {
          include: {
            order: {
              select: {
                branchId: true,
              },
            },
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    this.assertBranchAccess(user, claim.invoice.order.branchId);

    if (claim.status === dto.status) {
      return claim;
    }

    const allowedNextStatuses = CLAIM_STATUS_TRANSITIONS[claim.status] ?? [];
    if (!allowedNextStatuses.includes(dto.status)) {
      throw new ConflictException(
        `invalid_claim_status_transition: ${claim.status} -> ${dto.status}`,
      );
    }

    if (dto.status === 'APPROVED' || dto.status === 'PAID') {
      if (
        dto.amountApproved == null ||
        dto.amountApproved <= 0 ||
        dto.amountApproved > Number(claim.amountClaimed)
      ) {
        throw new BadRequestException(
          'invalid_amount_approved: amountApproved must be > 0 and <= amountClaimed',
        );
      }
    } else if (dto.amountApproved != null) {
      throw new BadRequestException(
        'invalid_amount_approved: amountApproved is only allowed for APPROVED or PAID claims',
      );
    }

    const updateResult = await this.prisma.claim.updateMany({
      where: { id, tenantId },
      data: {
        status: dto.status,
        amountApproved:
          dto.status === 'APPROVED' || dto.status === 'PAID'
            ? dto.amountApproved
            : null,
        remarks: dto.remarks,
      },
    });

    if (updateResult.count === 0) {
      throw new NotFoundException('Claim not found');
    }

    const updated = await this.prisma.claim.findFirst({
      where: { id, tenantId },
      include: {
        invoice: {
          include: {
            order: {
              select: {
                branchId: true,
              },
            },
          },
        },
      },
    });

    if (!updated) {
      throw new NotFoundException('Claim not found');
    }

    await this.audit.log(
      {
        tenantId,
        userId: user.userId!,
        eventKey: `CLAIM_${dto.status}`,
        recordType: 'Claim',
        recordId: id,
        oldValues: {
          status: claim.status,
          amountApproved: claim.amountApproved,
        },
        newValues: {
          status: updated.status,
          amountApproved: updated.amountApproved,
          remarks: updated.remarks,
        },
      },
      undefined,
      updated.invoice.order.branchId,
    );

    return updated;
  }

  async getHmoPartners(tenantId: string) {
    return this.prisma.hmoPartner.findMany({
      where: { tenantId, status: 'ACTIVE' },
    });
  }

  async getClaims(tenantId: string, user: RequestUser) {
    this.assertTenant(user, tenantId);
    this.assertBranchContext(user);

    return this.prisma.claim.findMany({
      where: {
        tenantId,
        ...(this.isSuperAdmin(user)
          ? {}
          : { invoice: { order: { branchId: user.branchId } } }),
      },
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
