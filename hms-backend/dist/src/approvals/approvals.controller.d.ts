import { ApprovalsService } from './approvals.service';
import { CreateApprovalRequestDto, ProcessApprovalRequestDto } from './dto/approval.dto';
export declare class ApprovalsController {
    private readonly approvalsService;
    constructor(approvalsService: ApprovalsService);
    create(tenantId: string, userId: string, dto: CreateApprovalRequestDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        recordId: string;
        remarks: string | null;
        reason: string | null;
        requesterId: string;
        approverId: string | null;
        type: string;
        riskLevel: string;
    }>;
    findAll(tenantId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        recordId: string;
        remarks: string | null;
        reason: string | null;
        requesterId: string;
        approverId: string | null;
        type: string;
        riskLevel: string;
    }[]>;
    approve(tenantId: string, userId: string, id: string, dto: ProcessApprovalRequestDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        recordId: string;
        remarks: string | null;
        reason: string | null;
        requesterId: string;
        approverId: string | null;
        type: string;
        riskLevel: string;
    }>;
    reject(tenantId: string, userId: string, id: string, dto: ProcessApprovalRequestDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        recordId: string;
        remarks: string | null;
        reason: string | null;
        requesterId: string;
        approverId: string | null;
        type: string;
        riskLevel: string;
    }>;
}
