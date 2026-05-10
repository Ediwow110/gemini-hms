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
exports.ClaimsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const numbering_service_1 = require("../numbering/numbering.service");
let ClaimsService = class ClaimsService {
    prisma;
    audit;
    numbering;
    constructor(prisma, audit, numbering) {
        this.prisma = prisma;
        this.audit = audit;
        this.numbering = numbering;
    }
    async createClaim(tenantId, userId, dto) {
        const claimNumber = await this.numbering.generateNumber(tenantId, 'CLAIM');
        const claim = await this.prisma.claim.create({
            data: {
                tenantId,
                hmoPartnerId: dto.hmoPartnerId,
                invoiceId: dto.invoiceId,
                claimNumber,
                loaNumber: dto.loaNumber,
                amountClaimed: dto.amountClaimed,
                status: 'PENDING',
            },
        });
        await this.audit.log({
            tenantId,
            userId,
            eventKey: 'CLAIM_CREATED',
            recordType: 'Claim',
            recordId: claim.id,
            newValues: claim,
        });
        return claim;
    }
    async updateStatus(tenantId, userId, id, dto) {
        const claim = await this.prisma.claim.findFirst({
            where: { id, tenantId }
        });
        if (!claim) {
            throw new common_1.NotFoundException('Claim not found');
        }
        const updated = await this.prisma.claim.update({
            where: { id },
            data: {
                status: dto.status,
                amountApproved: dto.amountApproved,
                remarks: dto.remarks,
            },
        });
        await this.audit.log({
            tenantId,
            userId,
            eventKey: `CLAIM_${dto.status}`,
            recordType: 'Claim',
            recordId: id,
            newValues: updated,
        });
        return updated;
    }
    async getHmoPartners(tenantId) {
        return this.prisma.hmoPartner.findMany({
            where: { tenantId, status: 'ACTIVE' },
        });
    }
    async getClaims(tenantId) {
        return this.prisma.claim.findMany({
            where: { tenantId },
            include: {
                hmoPartner: true,
                invoice: {
                    include: {
                        order: { include: { patient: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
};
exports.ClaimsService = ClaimsService;
exports.ClaimsService = ClaimsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        numbering_service_1.NumberingService])
], ClaimsService);
//# sourceMappingURL=claims.service.js.map