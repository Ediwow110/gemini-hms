import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(tenantId: string, userId: string, createOrderDto: CreateOrderDto): Promise<{
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
