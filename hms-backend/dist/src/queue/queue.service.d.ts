import { PrismaService } from '../prisma/prisma.service';
import { JoinQueueDto, UpdateQueueStatusDto } from './dto/queue.dto';
import { AuditService } from '../audit/audit.service';
export declare class QueueService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    joinQueue(tenantId: string, dto: JoinQueueDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string;
        patientId: string | null;
        category: string;
        patientName: string | null;
        serviceType: string;
        counterNumber: string | null;
        queueNumber: string;
    }>;
    getActiveDisplay(tenantId: string, branchId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string;
        patientId: string | null;
        category: string;
        patientName: string | null;
        serviceType: string;
        counterNumber: string | null;
        queueNumber: string;
    }[]>;
    updateStatus(tenantId: string, userId: string, id: string, dto: UpdateQueueStatusDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string;
        patientId: string | null;
        category: string;
        patientName: string | null;
        serviceType: string;
        counterNumber: string | null;
        queueNumber: string;
    }>;
    getWorklist(tenantId: string, serviceType: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string;
        patientId: string | null;
        category: string;
        patientName: string | null;
        serviceType: string;
        counterNumber: string | null;
        queueNumber: string;
    }[]>;
}
