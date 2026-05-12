import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AuditLogData {
  tenantId: string;
  userId: string;
  eventKey: string;
  recordType: string;
  recordId: string;
  oldValues?: any;
  newValues?: any;
}

export interface AuditQueryDto {
  eventKey?: string;
  userId?: string;
  recordType?: string;
  recordId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData, tx?: Prisma.TransactionClient) {
    const db = tx || this.prisma;
    return db.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        eventKey: data.eventKey,
        recordType: data.recordType,
        recordId: data.recordId,
        oldValues: data.oldValues,
        newValues: data.newValues,
      },
    });
  }

  async findAll(
    tenantId: string,
    branchId: string | undefined,
    userRoles: string[],
    query: AuditQueryDto,
  ) {
    const {
      eventKey,
      userId,
      recordType,
      recordId,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = query;

    // Scoping: Branch users only see their own branch unless granted broader access
    const isSuperAdmin = userRoles.includes('Super Admin');
    const where: any = { tenantId };

    if (!isSuperAdmin) {
      if (branchId) {
        where.branchId = branchId;
      } else {
        // Fallback for branch scoped users without a branch
        where.branchId = null;
      }
    } else if (query.branchId) {
      where.branchId = query.branchId;
    }

    if (eventKey) where.eventKey = eventKey;
    if (userId) where.userId = userId;
    if (recordType) where.recordType = recordType;
    if (recordId) where.recordId = recordId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const total = await this.prisma.auditLog.count({ where });
    const data = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  async findOne(
    tenantId: string,
    branchId: string | undefined,
    userRoles: string[],
    id: string,
  ) {
    const auditLog = await this.prisma.auditLog.findUnique({ where: { id } });

    if (!auditLog || auditLog.tenantId !== tenantId) {
      throw new NotFoundException('Audit log not found');
    }

    const isSuperAdmin = userRoles.includes('Super Admin');
    if (
      !isSuperAdmin &&
      branchId &&
      auditLog.branchId !== null &&
      auditLog.branchId !== branchId
    ) {
      throw new ForbiddenException('Access denied to this audit log');
    }

    return auditLog;
  }
}
