import { PrismaService } from '../prisma/prisma.service';
import { EncodeLabResultDto, ApproveLabResultDto, AmendLabResultDto } from './dto/lab.dto';
import { ApprovalsService } from '../approvals/approvals.service';
import { AuditService } from '../audit/audit.service';
export declare class LabService {
    private prisma;
    private audit;
    private approvals;
    constructor(prisma: PrismaService, audit: AuditService, approvals: ApprovalsService);
    findOne(tenantId: string, id: string): Promise<{
        order: {
            patient: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                firstName: string;
                lastName: string;
                dob: Date;
                patientNumber: string;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            branchId: string;
            patientId: string;
            orderNumber: string;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        approvedById: string | null;
        lockedAt: Date | null;
    }>;
    encodeResult(tenantId: string, userId: string, id: string, dto: EncodeLabResultDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        approvedById: string | null;
        lockedAt: Date | null;
    }>;
    approveResult(tenantId: string, userId: string, id: string, dto: ApproveLabResultDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        approvedById: string | null;
        lockedAt: Date | null;
    }>;
    requestAmendment(tenantId: string, userId: string, id: string, dto: AmendLabResultDto): Promise<{
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
    applyAmendment(tenantId: string, userId: string, id: string, reason: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        approvedById: string | null;
        lockedAt: Date | null;
    }>;
    releaseResult(tenantId: string, userId: string, id: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        approvedById: string | null;
        lockedAt: Date | null;
    }>;
    getPendingWorklist(tenantId: string): Promise<({
        order: {
            patient: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                firstName: string;
                lastName: string;
                dob: Date;
                patientNumber: string;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            branchId: string;
            patientId: string;
            orderNumber: string;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        approvedById: string | null;
        lockedAt: Date | null;
    })[]>;
}
