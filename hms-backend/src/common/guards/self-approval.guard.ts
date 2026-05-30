import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class SelfApprovalGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const recordId = request.params.id;

    if (!user || !recordId) return false;

    // Check ApprovalRequest first since it's the standard maker-checker model
    const approvalRequest = await this.prisma.approvalRequest.findUnique({
      where: { id: recordId },
    });

    if (approvalRequest && approvalRequest.tenantId === user.tenantId) {
      if (user.userId === approvalRequest.requesterId) {
        await this.logAndThrow(user, recordId);
      }
      return true;
    }

    // Check LabResult versions / orders if we needed to (assuming lab result approvals)
    // Since LabResult itself lacks createdBy, this guard defaults to pass if it cannot verify.
    // If the record exists but we can't prove ownership, we don't throw 403.

    // For specific Encounters:
    const encounter = await this.prisma.encounter.findUnique({
      where: { id: recordId },
    });
    if (
      encounter &&
      encounter.tenantId === user.tenantId &&
      user.userId === encounter.createdBy
    ) {
      await this.logAndThrow(user, recordId);
    }

    return true;
  }

  private async logAndThrow(user: any, recordId: string) {
    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.userId,
      eventKey: 'SELF_APPROVAL_BLOCKED',
      recordType: 'SECURITY',
      recordId: recordId,
      newValues: { targetId: recordId },
    });
    throw new ForbiddenException('self_approval_blocked');
  }
}
