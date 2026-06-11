import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { auditStorage } from './audit-context.middleware';
import { createHash, createHmac } from 'crypto';
import { AUDIT_CHAIN_SAFETY_CAP } from '../common/utils/pagination';

export interface AuditLogData {
  tenantId: string;
  userId: string;
  eventKey: string;
  recordType: string;
  recordId: string;
  oldValues?: any;
  newValues?: any;
}

export interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
  activeRole?: string;
  sessionId?: string;
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

  private canonicalize(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.canonicalize(item));
    }
    if (typeof obj === 'object') {
      const sortedKeys = Object.keys(obj).sort();
      const result: any = {};
      for (const key of sortedKeys) {
        if (obj[key] !== undefined) {
          result[key] = this.canonicalize(obj[key]);
        }
      }
      return result;
    }
    return obj;
  }

  private computeHash(entry: {
    tenantId: string;
    userId: string;
    eventKey: string;
    recordType: string;
    recordId: string;
    branchId?: string | null;
    oldValues: any;
    newValues: any;
    createdAt: Date;
    previousHash: string | null;
  }): string {
    const payload = JSON.stringify({
      tenantId: entry.tenantId,
      userId: entry.userId,
      eventKey: entry.eventKey,
      recordType: entry.recordType,
      recordId: entry.recordId,
      branchId: entry.branchId || null,
      oldValues: this.canonicalize(entry.oldValues),
      newValues: this.canonicalize(entry.newValues),
      createdAt: entry.createdAt.toISOString(), // Preserve exact persisted millisecond precision
      previousHash: entry.previousHash || '',
    });
    return createHash('sha256').update(payload).digest('hex');
  }

  async log(
    data: AuditLogData,
    tx?: Prisma.TransactionClient,
    branchId?: string,
    context?: AuditContext,
  ) {
    const db = tx || this.prisma;
    const req = auditStorage.getStore() as any;

    const ipAddress =
      context?.ipAddress ?? req?.headers?.['x-forwarded-for'] ?? req?.ip;
    const userAgent = context?.userAgent ?? req?.headers?.['user-agent'];
    const activeRole = context?.activeRole ?? req?.user?.role;
    const sessionId = context?.sessionId ?? req?.user?.sessionId;

    // Fetch the latest head in the tenant chain
    const lastLog =
      typeof db.auditLog?.findFirst === 'function'
        ? await db.auditLog.findFirst({
            where: { tenantId: data.tenantId },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          })
        : null;

    const previousHash = lastLog ? lastLog.hash : null;
    const createdAt = new Date();

    const hash = this.computeHash({
      tenantId: data.tenantId,
      userId: data.userId,
      eventKey: data.eventKey,
      recordType: data.recordType,
      recordId: data.recordId,
      branchId: branchId || null,
      oldValues: data.oldValues,
      newValues: data.newValues,
      createdAt,
      previousHash,
    });

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET must be defined for audit signing');
    }

    const signature = createHmac('sha256', process.env.JWT_SECRET)
      .update(hash)
      .digest('hex');

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
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        activeRole: activeRole || null,
        sessionId: sessionId || null,
        createdAt,
        previousHash,
        hash,
        signature,
      },
    });
  }

  async verifyChain(tenantId: string) {
    // Safety cap to prevent unbounded memory/DoS. The cap covers most
    // tenants; very large audit stores should use batched verification.
    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: AUDIT_CHAIN_SAFETY_CAP,
    });

    const corruptedLogIds: string[] = [];
    let expectedPreviousHash: string | null = null;

    for (const log of logs) {
      const computed = this.computeHash({
        tenantId: log.tenantId,
        userId: log.userId,
        eventKey: log.eventKey,
        recordType: log.recordType,
        recordId: log.recordId,
        branchId: log.branchId,
        oldValues: log.oldValues,
        newValues: log.newValues,
        createdAt: log.createdAt,
        previousHash: expectedPreviousHash,
      });

      if (log.hash !== computed || log.previousHash !== expectedPreviousHash) {
        corruptedLogIds.push(log.id);
      }

      expectedPreviousHash = log.hash;
    }

    return {
      isValid: corruptedLogIds.length === 0,
      truncated: logs.length >= AUDIT_CHAIN_SAFETY_CAP,
      verificationCount: logs.length,
      corruptedLogIds,
    };
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
        ipAddress: true,
        userAgent: true,
        activeRole: true,
        sessionId: true,
        hash: true,
        previousHash: true,
        signature: true,
        oldValues: isSuperAdmin,
        newValues: isSuperAdmin,
      },
    });

    const sanitizedData = data.map((item) => {
      const sanitized = { ...item };
      if (!isSuperAdmin) {
        const { oldValues, newValues, ...rest } = sanitized;
        void oldValues;
        void newValues;
        return rest;
      }
      return sanitized;
    });

    return { data: sanitizedData, total, page, pageSize: limit };
  }

  async findMyEvents(
    tenantId: string,
    userId: string,
    query: AuditQueryDto,
  ) {
    const { eventKey, recordType, recordId, startDate, endDate, page = 1, pageSize = 20 } = query;
    const limit = Math.min(pageSize, 100);
    const where: any = { tenantId, userId };

    if (eventKey) where.eventKey = eventKey;
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
        ipAddress: true,
        userAgent: true,
        activeRole: true,
        sessionId: true,
        hash: true,
        previousHash: true,
        signature: true,
      },
    });

    return { data, total, page, pageSize: limit };
  }

  async findEntityTimeline(
    tenantId: string,
    branchId: string | undefined,
    userRoles: string[],
    recordType: string,
    recordId: string,
    query: AuditQueryDto,
  ) {
    const { eventKey, userId, startDate, endDate, page = 1, pageSize = 20 } = query;
    const limit = Math.min(pageSize, 100);
    const isSuperAdmin = userRoles.includes('Super Admin');
    const where: any = { tenantId, recordType, recordId };

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
        ipAddress: true,
        userAgent: true,
        activeRole: true,
        sessionId: true,
        hash: true,
        previousHash: true,
        signature: true,
        oldValues: isSuperAdmin,
        newValues: isSuperAdmin,
      },
    });

    const sanitizedData = data.map((item) => {
      const sanitized = { ...item };
      if (!isSuperAdmin) {
        const { oldValues, newValues, ...rest } = sanitized;
        void oldValues;
        void newValues;
        return rest;
      }
      return sanitized;
    });

    return { data: sanitizedData, total, page, pageSize: limit };
  }

  async verifyChainWithSignatures(tenantId: string) {
    const chainResult = await this.verifyChain(tenantId);
    const signatureErrors: string[] = [];

    if (!process.env.JWT_SECRET) {
      return { ...chainResult, signatureErrors: ['JWT_SECRET is not configured'] };
    }

    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: AUDIT_CHAIN_SAFETY_CAP,
    });

    for (const log of logs) {
      if (log.signature && log.hash) {
        const expectedSignature = createHmac('sha256', process.env.JWT_SECRET)
          .update(log.hash)
          .digest('hex');
        if (log.signature !== expectedSignature) {
          signatureErrors.push(log.id);
        }
      }
    }

    return {
      ...chainResult,
      signatureErrors,
      isValid: chainResult.isValid && signatureErrors.length === 0,
    };
  }

  async exportEvents(
    tenantId: string,
    branchId: string | undefined,
    userRoles: string[],
    query: AuditQueryDto,
    format: 'csv' | 'json' = 'csv',
  ) {
    const result = await this.findAll(tenantId, branchId, userRoles, query);
    const isSuperAdmin = userRoles.includes('Super Admin');
    const fields = ['id', 'tenantId', 'branchId', 'userId', 'eventKey', 'recordType', 'recordId', 'createdAt', 'ipAddress', 'userAgent', 'activeRole', 'sessionId', 'hash', 'previousHash'];

    if (format === 'csv') {
      const rows = result.data.map((item: any) => {
        const row: Record<string, any> = {};
        for (const field of fields) {
          row[field] = item[field] ?? '';
        }
        return row;
      });
      return { data: rows, total: result.total, format: 'csv' };
    }

    const rows = result.data.map((item: any) => {
      const row: Record<string, any> = {};
      for (const field of fields) {
        row[field] = item[field] ?? null;
      }
      return row;
    });

    return { data: rows, total: result.total, format: 'json' };
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
        ipAddress: true,
        userAgent: true,
        activeRole: true,
        sessionId: true,
        hash: true,
        previousHash: true,
        signature: true,
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
      const { oldValues, newValues, ...rest } = sanitized;
      void oldValues;
      void newValues;
      return rest;
    }

    return sanitized;
  }
}
