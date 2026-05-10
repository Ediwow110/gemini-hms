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
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const numbering_service_1 = require("../numbering/numbering.service");
let PatientsService = class PatientsService {
    prisma;
    audit;
    numbering;
    constructor(prisma, audit, numbering) {
        this.prisma = prisma;
        this.audit = audit;
        this.numbering = numbering;
    }
    async create(tenantId, userId, dto) {
        const patientNumber = await this.numbering.generateNumber(tenantId, 'PATIENT');
        const existing = await this.prisma.patient.findFirst({
            where: {
                tenantId,
                firstName: dto.firstName,
                lastName: dto.lastName,
                dob: new Date(dto.dob),
            },
        });
        if (existing) {
            throw new common_1.ConflictException('A patient with this name and birthdate already exists');
        }
        const patient = await this.prisma.patient.create({
            data: {
                tenantId,
                patientNumber,
                firstName: dto.firstName,
                lastName: dto.lastName,
                dob: new Date(dto.dob),
                status: 'ACTIVE',
            },
        });
        await this.audit.log({
            tenantId,
            userId,
            eventKey: 'PATIENT_CREATED',
            recordType: 'Patient',
            recordId: patient.id,
            newValues: patient,
        });
        return patient;
    }
    async findAll(tenantId) {
        return this.prisma.patient.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(tenantId, id) {
        const patient = await this.prisma.patient.findFirst({
            where: { id, tenantId },
        });
        if (!patient) {
            throw new common_1.NotFoundException('Patient not found');
        }
        return patient;
    }
    async update(tenantId, userId, id, dto) {
        const existing = await this.findOne(tenantId, id);
        const updated = await this.prisma.patient.update({
            where: { id },
            data: {
                ...dto,
                dob: dto.dob ? new Date(dto.dob) : undefined,
            },
        });
        await this.audit.log({
            tenantId,
            userId,
            eventKey: 'PATIENT_UPDATED',
            recordType: 'Patient',
            recordId: id,
            oldValues: existing,
            newValues: updated,
        });
        return updated;
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        numbering_service_1.NumberingService])
], PatientsService);
//# sourceMappingURL=patients.service.js.map