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
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(data: AuditLogData, tx?: Prisma.TransactionClient): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        userId: string;
        eventKey: string;
        recordType: string;
        recordId: string;
        oldValues: Prisma.JsonValue | null;
        newValues: Prisma.JsonValue | null;
    }>;
}
