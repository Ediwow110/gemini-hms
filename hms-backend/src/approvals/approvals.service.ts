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
    dto: CreateApprovalRequestDto & { details?: ApprovalRequestDetailsInput },
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx || this.prisma;
    const requestBranchId = this.getRequestBranchId(dto.details);
    const request = await db.approvalRequest.create({
      data: {
        tenantId,
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

  async getRequests(tenantId: string) {
    return this.prisma.approvalRequest.findMany({
      where: { tenantId },
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
  ) {
    const request = await this.prisma.approvalRequest.findFirst({
      where: { id, tenantId },
    });

    if (!request) {
      throw new NotFoundException('Approval request not found');
    }

    const requestBranchId = this.getRequestBranchId(request.details);

    if (requestBranchId && requestBranchId !== branchId) {
      throw new NotFoundException('Approval request not found');
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

    // Process inside a transaction
    return this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.approvalRequest.updateMany({
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

      const updated = await tx.approvalRequest.findFirst({
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
        tx,
        requestBranchId,
      );

      return updated;
    });
  }
}
