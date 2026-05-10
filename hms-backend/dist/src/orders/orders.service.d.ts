import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
export declare class OrdersService {
    private prisma;
    private audit;
    private numbering;
    constructor(prisma: PrismaService, audit: AuditService, numbering: NumberingService);
    create(tenantId: string, userId: string, dto: CreateOrderDto): Promise<{
        order: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            branchId: string;
            patientId: string;
            orderNumber: string;
        };
        invoice: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            invoiceNumber: string | null;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            paidAmount: import("@prisma/client-runtime-utils").Decimal;
            orderId: string;
        };
    }>;
    findAll(tenantId: string): Promise<({
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
        invoice: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            invoiceNumber: string | null;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            paidAmount: import("@prisma/client-runtime-utils").Decimal;
            orderId: string;
        } | null;
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string;
        patientId: string;
        orderNumber: string;
    })[]>;
    findOne(tenantId: string, id: string): Promise<({
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
        invoice: ({
            payments: {
                id: string;
                status: string;
                createdAt: Date;
                invoiceId: string;
                cashierSessionId: string;
                receiptNumber: string | null;
                amount: import("@prisma/client-runtime-utils").Decimal;
                paymentMethod: string;
                idempotencyKey: string;
            }[];
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            invoiceNumber: string | null;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            paidAmount: import("@prisma/client-runtime-utils").Decimal;
            orderId: string;
        }) | null;
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string;
        patientId: string;
        orderNumber: string;
    }) | null>;
}
