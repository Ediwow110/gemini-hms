import { BillingService } from './billing.service';
import { CreatePaymentDto, OpenSessionDto, CloseSessionDto } from './dto/payment.dto';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    postPayment(tenantId: string, userId: string, createPaymentDto: CreatePaymentDto): Promise<{
        payment: {
            id: string;
            status: string;
            createdAt: Date;
            invoiceId: string;
            cashierSessionId: string;
            receiptNumber: string | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            paymentMethod: string;
            idempotencyKey: string;
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
    getInvoices(tenantId: string): Promise<({
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
    })[]>;
    openSession(tenantId: string, userId: string, dto: OpenSessionDto): Promise<{
        id: string;
        status: string;
        tenantId: string;
        userId: string;
        branchId: string;
        openingBalance: import("@prisma/client-runtime-utils").Decimal;
        closingBalance: import("@prisma/client-runtime-utils").Decimal | null;
        openedAt: Date;
        closedAt: Date | null;
    }>;
    closeSession(tenantId: string, userId: string, sessionId: string, dto: CloseSessionDto): Promise<{
        session: {
            id: string;
            status: string;
            tenantId: string;
            userId: string;
            branchId: string;
            openingBalance: import("@prisma/client-runtime-utils").Decimal;
            closingBalance: import("@prisma/client-runtime-utils").Decimal | null;
            openedAt: Date;
            closedAt: Date | null;
        };
        variance: number;
        expectedCash: number;
    }>;
    getActiveSession(tenantId: string, userId: string): Promise<({
        payments: ({
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
        } & {
            id: string;
            status: string;
            createdAt: Date;
            invoiceId: string;
            cashierSessionId: string;
            receiptNumber: string | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            paymentMethod: string;
            idempotencyKey: string;
        })[];
    } & {
        id: string;
        status: string;
        tenantId: string;
        userId: string;
        branchId: string;
        openingBalance: import("@prisma/client-runtime-utils").Decimal;
        closingBalance: import("@prisma/client-runtime-utils").Decimal | null;
        openedAt: Date;
        closedAt: Date | null;
    }) | null>;
}
