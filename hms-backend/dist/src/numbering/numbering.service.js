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
exports.NumberingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NumberingService = class NumberingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateNumber(tenantId, entityType, branchId) {
        const defaults = {
            'PATIENT': { prefix: 'PT-', padding: 6 },
            'ORDER': { prefix: 'ORD-', padding: 6 },
            'INVOICE': { prefix: 'INV-', padding: 6 },
            'RECEIPT': { prefix: 'RCP-', padding: 6 },
            'LAB_RESULT': { prefix: 'LAB-', padding: 6 },
            'CLAIM': { prefix: 'CLM-', padding: 6 },
        };
        const config = defaults[entityType] || { prefix: `${entityType}-`, padding: 6 };
        const safeBranchId = branchId || null;
        return this.prisma.$transaction(async (tx) => {
            let sequence = await tx.numberingSequence.findFirst({
                where: {
                    tenantId,
                    branchId: safeBranchId,
                    entityType,
                }
            });
            if (sequence) {
                sequence = await tx.numberingSequence.update({
                    where: { id: sequence.id },
                    data: { currentVal: { increment: 1 } }
                });
            }
            else {
                sequence = await tx.numberingSequence.create({
                    data: {
                        tenantId,
                        branchId: safeBranchId,
                        entityType,
                        prefix: config.prefix,
                        currentVal: 1,
                        padding: config.padding,
                    }
                });
            }
            const paddedValue = String(sequence.currentVal).padStart(sequence.padding, '0');
            return `${sequence.prefix}${paddedValue}`;
        });
    }
};
exports.NumberingService = NumberingService;
exports.NumberingService = NumberingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NumberingService);
//# sourceMappingURL=numbering.service.js.map