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
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let QueueService = class QueueService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async joinQueue(tenantId, dto) {
        const prefix = dto.serviceType.charAt(0).toUpperCase();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const count = await this.prisma.queueEntry.count({
            where: {
                tenantId,
                serviceType: dto.serviceType,
                createdAt: { gte: today }
            }
        });
        const queueNumber = `${prefix}-${(count + 1).toString().padStart(3, '0')}`;
        const entry = await this.prisma.queueEntry.create({
            data: {
                tenantId,
                branchId: dto.branchId,
                patientId: dto.patientId,
                patientName: dto.patientName,
                queueNumber,
                serviceType: dto.serviceType,
                category: dto.category || 'REGULAR',
                status: 'WAITING',
            },
        });
        return entry;
    }
    async getActiveDisplay(tenantId, branchId) {
        return this.prisma.queueEntry.findMany({
            where: {
                tenantId,
                branchId,
                status: { in: ['CALLING', 'SERVING'] },
                createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            },
            orderBy: { updatedAt: 'desc' },
            take: 10
        });
    }
    async updateStatus(tenantId, userId, id, dto) {
        const entry = await this.prisma.queueEntry.findFirst({
            where: { id, tenantId }
        });
        if (!entry) {
            throw new common_1.NotFoundException('Queue entry not found');
        }
        const updated = await this.prisma.queueEntry.update({
            where: { id },
            data: {
                status: dto.status,
                counterNumber: dto.counterNumber,
            }
        });
        if (dto.status === 'CALLING' || dto.status === 'COMPLETED') {
            await this.audit.log({
                tenantId,
                userId,
                eventKey: `QUEUE_${dto.status}`,
                recordType: 'QueueEntry',
                recordId: id,
                newValues: updated
            });
        }
        return updated;
    }
    async getWorklist(tenantId, serviceType) {
        return this.prisma.queueEntry.findMany({
            where: {
                tenantId,
                serviceType,
                status: { in: ['WAITING', 'CALLING', 'SERVING'] },
                createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            },
            orderBy: [
                { category: 'desc' },
                { createdAt: 'asc' }
            ]
        });
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], QueueService);
//# sourceMappingURL=queue.service.js.map