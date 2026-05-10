"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const numbering_service_1 = require("../numbering/numbering.service");
let BillingService = class BillingService {
    prisma;
    audit;
    numbering;
    constructor(prisma, audit, numbering) {
        this.prisma = prisma;
        this.audit = audit;
        this.numbering = numbering;
    }
    async postPayment(tenantId, userId, dto) {
        const invoice = await this.prisma.invoice.findFirst({
            where: {
                id: dto.invoiceId,
                order: { tenantId }
            },
            include: { order: true }
        });
        if (!invoice) {
            throw new common_1.BadRequestException('Invoice not found or access denied');
        }
        if (invoice.status === 'PAID') {
            throw new common_1.ConflictException('Invoice is already fully paid');
        }
        return this.prisma.$transaction(async (tx) => {
            const receiptNumber = await this.numbering.generateNumber(tenantId, 'RECEIPT');
            try {
                const payment = await tx.payment.create({
                    data: {
                        invoiceId: dto.invoiceId,
                        cashierSessionId: dto.cashierSessionId,
                        receiptNumber,
                        amount: dto.amount,
                        paymentMethod: dto.paymentMethod,
                        idempotencyKey: dto.idempotencyKey,
                        status: 'POSTED',
                    },
                });
                const newPaidAmount = Number(invoice.paidAmount) + dto.amount;
                const newStatus = newPaidAmount >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIALLY_PAID';
                const updatedInvoice = await tx.invoice.update({
                    where: { id: dto.invoiceId },
                    data: {
                        paidAmount: newPaidAmount,
                        status: newStatus,
                    },
                });
                if (newStatus === 'PAID') {
                    await tx.order.update({
                        where: { id: invoice.orderId },
                        data: { status: 'PAID' },
                    });
                }
                await this.audit.log({
                    tenantId,
                    userId,
                    eventKey: 'PAYMENT_POSTED',
                    recordType: 'Payment',
                    recordId: payment.id,
                    newValues: { payment, invoiceStatus: newStatus },
                });
                return { payment, invoice: updatedInvoice };
            }
            catch (error) {
                if (error.code === 'P2002') {
                    throw new common_1.ConflictException('Duplicate payment detected (Idempotency Key violation)');
                }
                throw error;
            }
        });
    }
    async getInvoices(tenantId) {
        return this.prisma.invoice.findMany({
            where: {
                order: { tenantId }
            },
            include: {
                order: {
                    include: { patient: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async openSession(tenantId, userId, dto) {
        const existing = await this.prisma.cashierSession.findFirst({
            where: { tenantId, userId, status: 'OPEN' }
        });
        if (existing) {
            throw new common_1.ConflictException('You already have an open cashier session');
        }
        const session = await this.prisma.cashierSession.create({
            data: {
                tenantId,
                branchId: dto.branchId,
                userId,
                openingBalance: dto.openingBalance,
                status: 'OPEN',
            }
        });
        await this.audit.log({
            tenantId,
            userId,
            eventKey: 'SESSION_OPENED',
            recordType: 'CashierSession',
            recordId: session.id,
            newValues: { openingBalance: dto.openingBalance },
        });
        return session;
    }
    async closeSession(tenantId, userId, sessionId, dto) {
        const session = await this.prisma.cashierSession.findFirst({
            where: { id: sessionId, tenantId, userId, status: 'OPEN' },
            include: { payments: true }
        });
        if (!session) {
            throw new common_1.BadRequestException('Active session not found or already closed');
        }
        const cashPayments = session.payments
            .filter(p => p.paymentMethod === 'CASH')
            .reduce((sum, p) => sum + Number(p.amount), 0);
        const expectedCash = Number(session.openingBalance) + cashPayments;
        const variance = dto.actualClosingBalance - expectedCash;
        if (variance !== 0 && !dto.remarks) {
            throw new common_1.BadRequestException('Remarks are required when there is a cash variance');
        }
        return this.prisma.$transaction(async (tx) => {
            const closed = await tx.cashierSession.update({
                where: { id: sessionId },
                data: {
                    status: 'CLOSED',
                    closingBalance: dto.actualClosingBalance,
                    closedAt: new Date(),
                }
            });
            await this.audit.log({
                tenantId,
                userId,
                eventKey: 'SESSION_CLOSED',
                recordType: 'CashierSession',
                recordId: sessionId,
                newValues: {
                    expectedCash,
                    actualCash: dto.actualClosingBalance,
                    variance,
                    remarks: dto.remarks
                },
            });
            return { session: closed, variance, expectedCash };
        });
    }
    async getActiveSession(tenantId, userId) {
        return this.prisma.cashierSession.findFirst({
            where: { tenantId, userId, status: 'OPEN' },
            include: {
                payments: {
                    include: { invoice: { include: { order: { include: { patient: true } } } } }
                }
            }
        });
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        numbering_service_1.NumberingService])
], BillingService);
//# sourceMappingURL=billing.service.js.map