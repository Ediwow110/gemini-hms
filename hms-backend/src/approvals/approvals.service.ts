import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import {
  CreateApprovalRequestDto,
  ProcessApprovalRequestDto,
} from './dto/approval.dto';

type ApprovalRequestDetailsInput = Prisma.ApprovalRequestCreateInput['details'];
type CreateApprovalRequestInput = CreateApprovalRequestDto & {
  details?: ApprovalRequestDetailsInput;
  branchId?: string;
};

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private getRequestBranchId(details: unknown): string | undefined {
    if (!details || typeof details !== 'object' || Array.isArray(details)) {
      return undefined;
    }

    if (!('branchId' in details)) {
      return undefined;
    }

    const branchId = details.branchId;
    return typeof branchId === 'string' ? branchId : undefined;
  }

  async createRequest(
    tenantId: string,
    userId: string,
    dto: CreateApprovalRequestInput,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx || this.prisma;
    const requestBranchId =
      dto.branchId ?? this.getRequestBranchId(dto.details);
    const request = await db.approvalRequest.create({
      data: {
        tenantId,
        branchId: requestBranchId,
        requesterId: userId,
        type: dto.type,
        riskLevel: dto.riskLevel,
        recordId: dto.recordId,
        reason: dto.reason,
        details: dto.details,
        status: 'PENDING',
      },
    });

    await this.audit.log(
      {
        tenantId,
        userId,
        eventKey: 'APPROVAL_REQUESTED',
        recordType: 'ApprovalRequest',
        recordId: request.id,
        newValues: request,
      },
      tx,
      requestBranchId,
    );

    return request;
  }

  async getRequests(
    tenantId: string,
    branchId?: string,
    isSuperAdmin = false,
    isTenantWide = false,
  ) {
    // Tenant-wide users (no branch scope) see all requests for the tenant.
    // Branch-scoped users see only their branch's requests.
    const effectiveBranchId =
      isSuperAdmin || isTenantWide ? undefined : branchId;

    return this.prisma.approvalRequest.findMany({
      where: {
        tenantId,
        branchId: effectiveBranchId,
      },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async processRequest(
    tenantId: string,
    userId: string,
    id: string,
    action: 'APPROVED' | 'REJECTED',
    dto: ProcessApprovalRequestDto,
    branchId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx || this.prisma;
    const request = await db.approvalRequest.findFirst({
      where: { id, tenantId },
    });

    if (!request) {
      throw new NotFoundException('Approval request not found');
    }

    const requestBranchId =
      request.branchId ?? this.getRequestBranchId(request.details);

    // Branch scoping enforcement:
    // 1. If user is branch-scoped (has branchId), they can only process requests for their branch.
    // 2. If request is tenant-wide (no requestBranchId), branch-scoped users cannot process it.
    if (branchId) {
      if (requestBranchId !== branchId) {
        throw new ForbiddenException(
          'Branch-scoped users cannot process this approval request',
        );
      }
    } else if (requestBranchId) {
      // If user is tenant-wide but request is branch-specific, we allow it (Super Admin / Tenant Admin case)
      // unless the business rule specifically forbids it. For now, we allow tenant-wide actors to process branch requests.
    }

    if (request.status !== 'PENDING') {
      throw new ConflictException(
        'invalid_workflow_transition: Request is already processed',
      );
    }

    // Maker-checker rule (Section 15: self_approval_blocked)
    if (request.requesterId === userId) {
      throw new ForbiddenException(
        'self_approval_blocked: You cannot approve or reject your own request',
      );
    }

    const applyUpdate = async (activeTx: Prisma.TransactionClient) => {
      const updateResult = await activeTx.approvalRequest.updateMany({
        where: {
          id,
          tenantId,
          status: 'PENDING',
        },
        data: {
          status: action,
          approverId: userId,
          remarks: dto.remarks,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'invalid_workflow_transition: Request is already processed or was modified',
        );
      }

      const updated = await activeTx.approvalRequest.findFirst({
        where: { id, tenantId },
      });

      if (!updated) {
        throw new NotFoundException('Approval request not found');
      }

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: `APPROVAL_${action}`,
          recordType: 'ApprovalRequest',
          recordId: id,
          oldValues: { status: request.status },
          newValues: updated,
        },
        activeTx,
        requestBranchId,
      );

      return updated;
    };

    if (tx) {
      return applyUpdate(tx);
    }

    return this.prisma.$transaction(applyUpdate);
  }
}
