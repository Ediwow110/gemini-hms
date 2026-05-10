import { PrismaService } from '../prisma/prisma.service';
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
    log(data: AuditLogData): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        userId: string;
        eventKey: string;
        recordType: string;
        recordId: string;
        oldValues: import("@prisma/client/runtime/client").JsonValue | null;
        newValues: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
}
