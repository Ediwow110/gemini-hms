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
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let ApprovalsService = class ApprovalsService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async createRequest(tenantId, userId, dto) {
        const request = await this.prisma.approvalRequest.create({
            data: {
                tenantId,
                requesterId: userId,
                type: dto.type,
                riskLevel: dto.riskLevel,
                recordId: dto.recordId,
                reason: dto.reason,
                status: 'PENDING'
            }
        });
        await this.audit.log({
            tenantId,
            userId,
            eventKey: 'APPROVAL_REQUESTED',
            recordType: 'ApprovalRequest',
            recordId: request.id,
            newValues: request
        });
        return request;
    }
    async getRequests(tenantId) {
        return this.prisma.approvalRequest.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async processRequest(tenantId, userId, id, action, dto) {
        const request = await this.prisma.approvalRequest.findFirst({
            where: { id, tenantId }
        });
        if (!request) {
            throw new common_1.NotFoundException('Approval request not found');
        }
        if (request.status !== 'PENDING') {
            throw new common_1.ConflictException('invalid_workflow_transition: Request is already processed');
        }
        if (request.requesterId === userId) {
            throw new common_1.ForbiddenException('self_approval_blocked: You cannot approve or reject your own request');
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.approvalRequest.update({
                where: { id },
                data: {
                    status: action,
                    approverId: userId,
                    remarks: dto.remarks
                }
            });
            await this.audit.log({
                tenantId,
                userId,
                eventKey: `APPROVAL_${action}`,
                recordType: 'ApprovalRequest',
                recordId: id,
                oldValues: { status: request.status },
                newValues: updated
            });
            return updated;
        });
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map