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

  async log(
    data: AuditLogData,
    tx?: Prisma.TransactionClient,
    branchId?: string,
  ) {
    const db = tx || this.prisma;
    return db.auditLog.create({
      data: {
        tenantId: data.tenantId,
        branchId: branchId,
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

    const limit = Math.min(pageSize, 100);
    const isSuperAdmin = userRoles.includes('Super Admin');
    const where: any = { tenantId };

    if (!isSuperAdmin) {
      if (branchId) {
        where.branchId = branchId;
      } else {
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
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        tenantId: true,
        branchId: true,
        userId: true,
        eventKey: true,
        recordType: true,
        recordId: true,
        createdAt: true,
        oldValues: isSuperAdmin,
        newValues: isSuperAdmin,
      },
    });

    // Explicitly strip if select did not fetch them (Prisma select might return nulls or undefined)
    const sanitizedData = data.map((item) => {
      const sanitized = { ...item };
      if (!isSuperAdmin) {
        delete (sanitized as any).oldValues;
        delete (sanitized as any).newValues;
      }
      return sanitized;
    });

    return { data: sanitizedData, total, page, pageSize: limit };
  }

  async findOne(
    tenantId: string,
    branchId: string | undefined,
    userRoles: string[],
    id: string,
  ) {
    const isSuperAdmin = userRoles.includes('Super Admin');
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        branchId: true,
        userId: true,
        eventKey: true,
        recordType: true,
        recordId: true,
        createdAt: true,
        oldValues: true,
        newValues: true,
      },
    });

    if (!auditLog || auditLog.tenantId !== tenantId) {
      throw new NotFoundException('Audit log not found');
    }

    if (
      !isSuperAdmin &&
      branchId &&
      auditLog.branchId !== null &&
      auditLog.branchId !== branchId
    ) {
      throw new ForbiddenException('Access denied to this audit log');
    }

    const sanitized = { ...auditLog };
    if (!isSuperAdmin) {
      delete (sanitized as any).oldValues;
      delete (sanitized as any).newValues;
    }

    return sanitized;
  }
}
