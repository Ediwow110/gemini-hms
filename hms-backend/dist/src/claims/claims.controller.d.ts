import { ClaimsService } from './claims.service';
import { CreateClaimDto, UpdateClaimStatusDto } from './dto/claims.dto';
export declare class ClaimsController {
    private readonly claimsService;
    constructor(claimsService: ClaimsService);
    getPartners(tenantId: string): Promise<{
        id: string;
        name: string;
        status: string;
        createdAt: Date;
        tenantId: string;
        email: string | null;
        code: string;
        contactPerson: string | null;
    }[]>;
    getClaims(tenantId: string): Promise<({
        invoice: {
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
            invoiceNumber: string | null;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            paidAmount: import("@prisma/client-runtime-utils").Decimal;
            orderId: string;
        };
        hmoPartner: {
            id: string;
            name: string;
            status: string;
            createdAt: Date;
            tenantId: string;
            email: string | null;
            code: string;
            contactPerson: string | null;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        invoiceId: string;
        remarks: string | null;
        hmoPartnerId: string;
        loaNumber: string | null;
        amountClaimed: import("@prisma/client-runtime-utils").Decimal;
        amountApproved: import("@prisma/client-runtime-utils").Decimal | null;
        claimNumber: string;
    })[]>;
    createClaim(tenantId: string, userId: string, dto: CreateClaimDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        invoiceId: string;
        remarks: string | null;
        hmoPartnerId: string;
        loaNumber: string | null;
        amountClaimed: import("@prisma/client-runtime-utils").Decimal;
        amountApproved: import("@prisma/client-runtime-utils").Decimal | null;
        claimNumber: string;
    }>;
    updateStatus(tenantId: string, userId: string, id: string, dto: UpdateClaimStatusDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        invoiceId: string;
        remarks: string | null;
        hmoPartnerId: string;
        loaNumber: string | null;
        amountClaimed: import("@prisma/client-runtime-utils").Decimal;
        amountApproved: import("@prisma/client-runtime-utils").Decimal | null;
        claimNumber: string;
    }>;
}
