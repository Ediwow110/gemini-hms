import { Injectable } from '@nestjs/common';
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
}
