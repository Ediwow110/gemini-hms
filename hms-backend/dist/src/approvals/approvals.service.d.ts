import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateApprovalRequestDto, ProcessApprovalRequestDto } from './dto/approval.dto';
export declare class ApprovalsService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    createRequest(tenantId: string, userId: string, dto: CreateApprovalRequestDto): Promise<{
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
    getRequests(tenantId: string): Promise<{
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
    processRequest(tenantId: string, userId: string, id: string, action: 'APPROVED' | 'REJECTED', dto: ProcessApprovalRequestDto): Promise<{
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
