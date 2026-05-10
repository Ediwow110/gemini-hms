import { LabService } from './lab.service';
import { EncodeLabResultDto, ApproveLabResultDto, AmendLabResultDto } from './dto/lab.dto';
export declare class LabController {
    private readonly labService;
    constructor(labService: LabService);
    getWorklist(tenantId: string): Promise<({
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
    encode(tenantId: string, userId: string, id: string, dto: EncodeLabResultDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        approvedById: string | null;
        lockedAt: Date | null;
    }>;
    approve(tenantId: string, userId: string, id: string, dto: ApproveLabResultDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        approvedById: string | null;
        lockedAt: Date | null;
    }>;
    release(tenantId: string, userId: string, id: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        approvedById: string | null;
        lockedAt: Date | null;
    }>;
    amend(tenantId: string, userId: string, id: string, dto: AmendLabResultDto): Promise<{
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
