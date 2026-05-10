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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let InventoryService = class InventoryService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async createItem(tenantId, userId, dto) {
        const item = await this.prisma.inventoryItem.create({
            data: {
                tenantId,
                ...dto,
            },
        });
        await this.audit.log({
            tenantId,
            userId,
            eventKey: 'INVENTORY_ITEM_CREATED',
            recordType: 'InventoryItem',
            recordId: item.id,
            newValues: item,
        });
        return item;
    }
    async receiveStock(tenantId, userId, id, dto) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { id, tenantId },
        });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        return this.prisma.$transaction(async (tx) => {
            const previousStock = item.currentStock;
            const newStock = previousStock + dto.quantity;
            const updatedItem = await tx.inventoryItem.update({
                where: { id },
                data: { currentStock: newStock },
            });
            const log = await tx.stockLog.create({
                data: {
                    tenantId,
                    inventoryItemId: id,
                    type: 'IN',
                    quantity: dto.quantity,
                    previousStock,
                    newStock,
                    remarks: dto.remarks ||
                        `Stock received from ${dto.supplierName || 'unknown'}`,
                },
            });
            await this.audit.log({
                tenantId,
                userId,
                eventKey: 'STOCK_RECEIVED',
                recordType: 'InventoryItem',
                recordId: id,
                newValues: { log, updatedItem },
            }, tx);
            return updatedItem;
        });
    }
    async getCatalog(tenantId) {
        return this.prisma.inventoryItem.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
        });
    }
    async getStockLogs(tenantId, itemId) {
        return this.prisma.stockLog.findMany({
            where: { tenantId, inventoryItemId: itemId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async dispenseItem(tenantId, userId, id, quantity, orderId) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { id, tenantId },
        });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        if (item.currentStock < quantity) {
            throw new common_1.BadRequestException(`insufficient_stock: Only ${item.currentStock} ${item.unit} available`);
        }
        return this.prisma.$transaction(async (tx) => {
            const previousStock = item.currentStock;
            const newStock = previousStock - quantity;
            const updatedItem = await tx.inventoryItem.update({
                where: { id },
                data: { currentStock: newStock },
            });
            const log = await tx.stockLog.create({
                data: {
                    tenantId,
                    inventoryItemId: id,
                    type: 'OUT',
                    quantity: quantity,
                    previousStock,
                    newStock,
                    referenceType: 'DISPENSING',
                    referenceId: orderId,
                    remarks: `Dispensed ${quantity} ${item.unit} for order ${orderId || 'N/A'}`,
                },
            });
            if (newStock <= item.reorderLevel && previousStock > item.reorderLevel) {
                const existingAlert = await tx.notification.findFirst({
                    where: {
                        tenantId,
                        status: 'PENDING',
                        content: { contains: `(SKU: ${item.sku})` },
                    },
                });
                if (!existingAlert) {
                    await tx.notification.create({
                        data: {
                            tenantId,
                            type: 'IN_APP',
                            recipient: 'ROLE:Pharmacist',
                            subject: 'LOW STOCK ALERT: ' + item.name,
                            content: `Item ${item.name} (SKU: ${item.sku}) has fallen to ${newStock} ${item.unit}. Reorder level is ${item.reorderLevel}.`,
                            status: 'PENDING',
                        },
                    });
                }
            }
            await this.audit.log({
                tenantId,
                userId,
                eventKey: 'STOCK_DISPENSED',
                recordType: 'InventoryItem',
                recordId: id,
                newValues: { log, updatedItem },
            }, tx);
            return updatedItem;
        });
    }
    async getLowStockAlerts(tenantId) {
        return this.prisma.inventoryItem.findMany({
            where: {
                tenantId,
                currentStock: { lte: this.prisma.inventoryItem.fields.reorderLevel },
            },
            orderBy: { currentStock: 'asc' },
        });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map