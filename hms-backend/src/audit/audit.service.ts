import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { auditStorage } from './audit-context.middleware';
import { createHash, createHmac } from 'crypto';
import { AUDIT_CHAIN_SAFETY_CAP } from '../common/utils/pagination';
import { AUDIT_EVENT_KEYS } from './audit-event-keys';

export interface AuditLogData {
  tenantId: string;
  userId: string;
  eventKey: string;
  recordType: string;
  recordId: string;
  oldValues?: any;
  newValues?: any;
}

export interface SystemAuditLogData {
  tenantId: string;
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
  private readonly logger = new Logger(AuditService.name);

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
    userId: string | null;
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

  private getAuditSecret(): string {
    if (process.env.AUDIT_CHAIN_SECRET) {
      return process.env.AUDIT_CHAIN_SECRET;
    }
    if (process.env.JWT_SECRET) {
      Logger.warn(
        'AUDIT_CHAIN_SECRET not set — falling back to JWT_SECRET for audit HMAC. Set AUDIT_CHAIN_SECRET for proper secret isolation.',
        'AuditService',
      );
      return process.env.JWT_SECRET;
    }
    throw new Error(
      'AUDIT_CHAIN_SECRET or JWT_SECRET must be defined for audit signing',
    );
  }

  /**
   * Resolve the system actor user for a given tenant.
   * System actors are non-interactive accounts created per tenant.
   */
  private async resolveSystemActor(
    tenantId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const db = tx || this.prisma;
    const systemUser = await (db as any).user.findFirst({
      where: { tenantId, isSystem: true },
      select: { id: true },
    });
    if (!systemUser) {
      throw new Error(
        `System actor not found for tenant ${tenantId}. Ensure every tenant has a non-interactive system actor.`,
      );
    }
    return systemUser.id;
  }

  /**
   * Log a human-initiated audit event. Requires a real userId.
   */
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

    // Human audit requires a non-null userId
    const userId = data.userId;
    if (!userId) {
      throw new Error(
        'AuditService.log() requires a non-null userId for human-initiated events. Use logSystemEvent() for system events.',
      );
    }

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
      userId: userId,
      eventKey: data.eventKey,
      recordType: data.recordType,
      recordId: data.recordId,
      branchId: branchId || null,
      oldValues: data.oldValues,
      newValues: data.newValues,
      createdAt,
      previousHash,
    });

    const secret = this.getAuditSecret();

    const signature = createHmac('sha256', secret).update(hash).digest('hex');

    return db.auditLog.create({
      data: {
        tenantId: data.tenantId,
        branchId: branchId,
        userId: userId,
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
    let hasMore = true;
    let cursorId: string | undefined = undefined;
    const batchSize = 5000;

    const corruptedLogIds: string[] = [];
    const legacyUnverifiableIds: string[] = [];
    let expectedPreviousHash: string | null = null;
    let totalLogs = 0;

    while (hasMore) {
      const logs: any[] = await this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: batchSize,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? { id: cursorId } : undefined,
      });

      if (logs.length === 0) {
        hasMore = false;
        break;
      }

      totalLogs += logs.length;
      cursorId = logs[logs.length - 1].id;

      for (const log of logs) {
        if (log.hash === null) {
          legacyUnverifiableIds.push(log.id);
          expectedPreviousHash = null;
          continue;
        }

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

        if (
          log.hash !== computed ||
          log.previousHash !== expectedPreviousHash
        ) {
          corruptedLogIds.push(log.id);
        }

        expectedPreviousHash = log.hash;
      }
    }

    return {
      isValid: corruptedLogIds.length === 0,
      hasLegacyRows: legacyUnverifiableIds.length > 0,
      legacyUnverifiableCount: legacyUnverifiableIds.length,
      truncated: false,
      verificationCount: totalLogs - legacyUnverifiableIds.length,
      totalLogs: totalLogs,
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
    const isTenantWideViewer = userRoles.some((role) =>
      ['Super Admin', 'Compliance Officer', 'Tenant Admin'].includes(role),
    );
    const where: any = { tenantId };

    if (!isTenantWideViewer) {
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

  async findMyEvents(tenantId: string, userId: string, query: AuditQueryDto) {
    const {
      eventKey,
      recordType,
      recordId,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = query;
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
    const {
      eventKey,
      userId,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = query;
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

    let auditSecret: string;
    try {
      auditSecret = this.getAuditSecret();
    } catch {
      return {
        ...chainResult,
        signatureErrors: ['Audit chain secret is not configured'],
      };
    }

    let hasMore = true;
    let cursorId: string | undefined = undefined;
    const batchSize = 5000;

    while (hasMore) {
      const batchLogs: any[] = await this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: batchSize,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? { id: cursorId } : undefined,
      });

      if (batchLogs.length === 0) {
        hasMore = false;
        break;
      }

      cursorId = batchLogs[batchLogs.length - 1].id;

      for (const log of batchLogs) {
        if (log.signature && log.hash) {
          const expectedSignature = createHmac('sha256', auditSecret)
            .update(log.hash)
            .digest('hex');
          if (log.signature !== expectedSignature) {
            signatureErrors.push(log.id);
          }
        }
      }
    }

    return {
      ...chainResult,
      signatureErrors,
      isValid: chainResult.isValid && signatureErrors.length === 0,
    };
  }

  /**
   * Log a system-initiated audit event. Resolves the tenant's system actor internally.
   */
  async logSystemEvent(
    data: SystemAuditLogData,
    tx?: Prisma.TransactionClient,
    branchId?: string,
    context?: AuditContext,
  ) {
    const db = tx || this.prisma;
    const req = auditStorage.getStore() as any;

    const ipAddress =
      context?.ipAddress ?? req?.headers?.['x-forwarded-for'] ?? req?.ip;
    const userAgent = context?.userAgent ?? req?.headers?.['user-agent'];
    const activeRole = 'SYSTEM';
    const sessionId = null;

    const userId = await this.resolveSystemActor(data.tenantId, tx);

    // Fetch the latest head in the tenant chain
    const lastLog =
      typeof (db as any).auditLog?.findFirst === 'function'
        ? await (db as any).auditLog.findFirst({
            where: { tenantId: data.tenantId },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          })
        : null;

    const previousHash = lastLog ? lastLog.hash : null;
    const createdAt = new Date();

    const hash = this.computeHash({
      tenantId: data.tenantId,
      userId: userId,
      eventKey: data.eventKey,
      recordType: data.recordType,
      recordId: data.recordId,
      branchId: branchId || null,
      oldValues: data.oldValues,
      newValues: data.newValues,
      createdAt,
      previousHash,
    });

    const secret = this.getAuditSecret();

    const signature = createHmac('sha256', secret).update(hash).digest('hex');

    return db.auditLog.create({
      data: {
        tenantId: data.tenantId,
        branchId: branchId,
        userId: userId,
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

  async exportMyEvents(
    tenantId: string,
    userId: string,
    query: AuditQueryDto,
    format: 'csv' | 'json' = 'csv',
  ) {
    const { eventKey, recordType, recordId, startDate, endDate } = query;
    const take = AUDIT_CHAIN_SAFETY_CAP;
    const where: any = { tenantId, userId };

    if (eventKey) where.eventKey = eventKey;
    if (recordType) where.recordType = recordType;
    if (recordId) where.recordId = recordId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const totalAvailable = await this.prisma.auditLog.count({ where });
    const rows = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
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
      },
    });

    const exportedCount = rows.length;
    const truncated = exportedCount < totalAvailable;

    try {
      await this.log({
        tenantId,
        userId,
        eventKey: AUDIT_EVENT_KEYS.AUDIT_LOG_EXPORTED,
        recordType: 'AuditLog',
        recordId: 'self',
        newValues: {
          format,
          count: exportedCount,
          totalAvailable,
          filters: query,
        },
      });
    } catch (err) {
      const msg = (err as Error).message;
      const logMsg = `Failed to log AUDIT_LOG_EXPORTED for self-export: ${msg}`;
      this.logger.warn(logMsg);
    }

    const fields = [
      'id',
      'tenantId',
      'branchId',
      'userId',
      'eventKey',
      'recordType',
      'recordId',
      'createdAt',
      'ipAddress',
      'userAgent',
      'activeRole',
      'sessionId',
      'hash',
      'previousHash',
    ];

    if (format === 'csv') {
      const data = rows.map((item: any) => {
        const row: Record<string, any> = {};
        for (const field of fields) {
          row[field] = item[field] ?? '';
        }
        return row;
      });
      return { data, exportedCount, totalAvailable, truncated, format: 'csv' };
    }

    const data = rows.map((item: any) => {
      const row: Record<string, any> = {};
      for (const field of fields) {
        row[field] = item[field] ?? null;
      }
      return row;
    });

    return { data, exportedCount, totalAvailable, truncated, format: 'json' };
  }

  async exportEvents(
    tenantId: string,
    branchId: string | undefined,
    userRoles: string[],
    userId: string,
    query: AuditQueryDto,
    format: 'csv' | 'json' = 'csv',
  ) {
    const { eventKey, recordType, recordId, startDate, endDate } = query;
    const take = AUDIT_CHAIN_SAFETY_CAP;
    const isSuperAdmin = userRoles.includes('Super Admin');
    const where: any = { tenantId };

    if (!isSuperAdmin) {
      if (branchId) {
        where.branchId = branchId;
      } else {
        where.branchId = null;
      }
    }

    if (eventKey) where.eventKey = eventKey;
    if (query.userId) where.userId = query.userId;
    if (recordType) where.recordType = recordType;
    if (recordId) where.recordId = recordId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const totalAvailable = await this.prisma.auditLog.count({ where });
    const rows = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
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
      },
    });

    const exportedCount = rows.length;
    const truncated = exportedCount < totalAvailable;

    try {
      await this.log({
        tenantId,
        userId,
        eventKey: AUDIT_EVENT_KEYS.AUDIT_LOG_EXPORTED,
        recordType: 'AuditLog',
        recordId: 'bulk',
        newValues: {
          format,
          count: exportedCount,
          totalAvailable,
          filters: query,
        },
      });
    } catch (err) {
      const msg = (err as Error).message;
      this.logger.warn(`Failed to log AUDIT_LOG_EXPORTED: ${msg}`);
    }

    const fields = [
      'id',
      'tenantId',
      'branchId',
      'userId',
      'eventKey',
      'recordType',
      'recordId',
      'createdAt',
      'ipAddress',
      'userAgent',
      'activeRole',
      'sessionId',
      'hash',
      'previousHash',
    ];

    if (format === 'csv') {
      const data = rows.map((item: any) => {
        const row: Record<string, any> = {};
        for (const field of fields) {
          row[field] = item[field] ?? '';
        }
        return row;
      });
      return { data, exportedCount, totalAvailable, truncated, format: 'csv' };
    }

    const data = rows.map((item: any) => {
      const row: Record<string, any> = {};
      for (const field of fields) {
        row[field] = item[field] ?? null;
      }
      return row;
    });

    return { data, exportedCount, totalAvailable, truncated, format: 'json' };
  }

  async findMyEvent(tenantId: string, userId: string, id: string) {
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
      },
    });

    if (!auditLog || auditLog.tenantId !== tenantId) {
      throw new NotFoundException('Audit log not found');
    }

    if (auditLog.userId !== userId) {
      throw new ForbiddenException('Access denied to this audit log');
    }

    return auditLog;
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
