import { PrismaService } from '../prisma/prisma.service';
import { CreateClaimDto, UpdateClaimStatusDto } from './dto/claims.dto';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
export declare class ClaimsService {
    private prisma;
    private audit;
    private numbering;
    constructor(prisma: PrismaService, audit: AuditService, numbering: NumberingService);
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
    getHmoPartners(tenantId: string): Promise<{
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
}
