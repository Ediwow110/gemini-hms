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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const numbering_service_1 = require("../numbering/numbering.service");
let OrdersService = class OrdersService {
    prisma;
    audit;
    numbering;
    constructor(prisma, audit, numbering) {
        this.prisma = prisma;
        this.audit = audit;
        this.numbering = numbering;
    }
    async create(tenantId, userId, dto) {
        if (dto.items.length === 0) {
            throw new common_1.BadRequestException('Order must contain at least one item');
        }
        const totalAmount = dto.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return this.prisma.$transaction(async (tx) => {
            const orderNumber = await this.numbering.generateNumber(tenantId, 'ORDER', dto.branchId);
            const order = await tx.order.create({
                data: {
                    tenantId,
                    branchId: dto.branchId,
                    patientId: dto.patientId,
                    orderNumber,
                    status: 'PENDING_PAYMENT',
                },
            });
            const invoiceNumber = await this.numbering.generateNumber(tenantId, 'INVOICE', dto.branchId);
            const invoice = await tx.invoice.create({
                data: {
                    orderId: order.id,
                    invoiceNumber,
                    totalAmount: totalAmount,
                    paidAmount: 0,
                    status: 'UNPAID',
                },
            });
            await this.audit.log({
                tenantId,
                userId,
                eventKey: 'ORDER_CREATED',
                recordType: 'Order',
                recordId: order.id,
                newValues: { order, invoice, itemsCount: dto.items.length },
            });
            return { order, invoice };
        });
    }
    async findAll(tenantId) {
        return this.prisma.order.findMany({
            where: { tenantId },
            include: {
                patient: true,
                invoice: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(tenantId, id) {
        return this.prisma.order.findFirst({
            where: { id, tenantId },
            include: {
                patient: true,
                invoice: {
                    include: {
                        payments: true,
                    },
                },
            },
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        numbering_service_1.NumberingService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map