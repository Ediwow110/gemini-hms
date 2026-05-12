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

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createRequest(
    tenantId: string,
    userId: string,
    dto: CreateApprovalRequestDto & { details?: any },
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx || this.prisma;
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
  ) {
    const request = await this.prisma.approvalRequest.findFirst({
      where: { id, tenantId },
    });

    if (!request) {
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
      const updated = await tx.approvalRequest.update({
        where: { id },
        data: {
          status: action,
          approverId: userId,
          remarks: dto.remarks,
        },
      });

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
      );

      return updated;
    });
  }
}
