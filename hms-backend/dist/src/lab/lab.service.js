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
exports.LabService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const approvals_service_1 = require("../approvals/approvals.service");
const audit_service_1 = require("../audit/audit.service");
let LabService = class LabService {
    prisma;
    audit;
    approvals;
    constructor(prisma, audit, approvals) {
        this.prisma = prisma;
        this.audit = audit;
        this.approvals = approvals;
    }
    async findOne(tenantId, id) {
        const result = await this.prisma.labResult.findFirst({
            where: { id, order: { tenantId } },
            include: { order: { include: { patient: true } } }
        });
        if (!result) {
            throw new common_1.NotFoundException('Lab result not found');
        }
        return result;
    }
    async encodeResult(tenantId, userId, id, dto) {
        const result = await this.findOne(tenantId, id);
        if (result.status === 'RELEASED') {
            throw new common_1.ConflictException('released_result_immutable: Cannot edit a result that has already been released');
        }
        const updated = await this.prisma.labResult.update({
            where: { id },
            data: {
                status: 'ENCODED',
            },
        });
        await this.audit.log({
            tenantId,
            userId,
            eventKey: 'RESULT_ENCODED',
            recordType: 'LabResult',
            recordId: id,
            newValues: { results: dto.results, remarks: dto.remarks },
        });
        return updated;
    }
    async approveResult(tenantId, userId, id, dto) {
        const result = await this.findOne(tenantId, id);
        if (result.status === 'RELEASED') {
            throw new common_1.ConflictException('Cannot approve a result that is already released');
        }
        const updated = await this.prisma.labResult.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvedById: userId,
            },
        });
        await this.audit.log({
            tenantId,
            userId,
            eventKey: 'RESULT_APPROVED',
            recordType: 'LabResult',
            recordId: id,
            newValues: { approvedBy: userId, remarks: dto.pathologistRemarks },
        });
        return updated;
    }
    async requestAmendment(tenantId, userId, id, dto) {
        const result = await this.findOne(tenantId, id);
        if (result.status !== 'RELEASED') {
            throw new common_1.BadRequestException('Only released results can be amended');
        }
        return this.approvals.createRequest(tenantId, userId, {
            type: 'RESULT_AMENDMENT',
            riskLevel: 'CRITICAL',
            recordId: id,
            reason: dto.reason,
        });
    }
    async applyAmendment(tenantId, userId, id, reason) {
        const result = await this.findOne(tenantId, id);
        if (result.status !== 'RELEASED') {
            throw new common_1.BadRequestException('Result must be released to apply an amendment');
        }
        return this.prisma.$transaction(async (tx) => {
            const versionCount = await tx.labResultVersion.count({ where: { labResultId: id } });
            const version = await tx.labResultVersion.create({
                data: {
                    labResultId: id,
                    version: versionCount + 1,
                    oldStatus: result.status,
                    newStatus: 'AMENDED',
                    amendedById: userId,
                    reason: reason,
                }
            });
            const updated = await tx.labResult.update({
                where: { id },
                data: {
                    status: 'AMENDED',
                    lockedAt: null,
                    approvedById: null,
                }
            });
            await this.audit.log({
                tenantId,
                userId,
                eventKey: 'RESULT_AMENDMENT_APPLIED',
                recordType: 'LabResult',
                recordId: id,
                newValues: { versionId: version.id, status: 'AMENDED' },
            });
            return updated;
        });
    }
    async releaseResult(tenantId, userId, id) {
        const result = await this.findOne(tenantId, id);
        if (result.status !== 'APPROVED') {
            throw new common_1.BadRequestException('Only approved results can be released');
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.labResult.update({
                where: { id },
                data: {
                    status: 'RELEASED',
                    lockedAt: new Date(),
                },
            });
            await this.audit.log({
                tenantId,
                userId,
                eventKey: 'RESULT_RELEASED',
                recordType: 'LabResult',
                recordId: id,
                newValues: { releasedAt: updated.lockedAt },
            });
            return updated;
        });
    }
    async getPendingWorklist(tenantId) {
        return this.prisma.labResult.findMany({
            where: {
                order: { tenantId },
                status: { in: ['PENDING_COLLECTION', 'ENCODED', 'APPROVED'] }
            },
            include: {
                order: { include: { patient: true } }
            },
            orderBy: { createdAt: 'asc' }
        });
    }
};
exports.LabService = LabService;
exports.LabService = LabService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        approvals_service_1.ApprovalsService])
], LabService);
//# sourceMappingURL=lab.service.js.map