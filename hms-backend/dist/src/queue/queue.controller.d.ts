import { QueueService } from './queue.service';
import { JoinQueueDto, UpdateQueueStatusDto } from './dto/queue.dto';
export declare class QueueController {
    private readonly queueService;
    constructor(queueService: QueueService);
    join(tenantId: string, dto: JoinQueueDto): Promise<{
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
    getDisplay(tenantId: string, branchId: string): Promise<{
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
}
