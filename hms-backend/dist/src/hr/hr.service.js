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
exports.HrService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let HrService = class HrService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async createDepartment(tenantId, userId, dto) {
        const department = await this.prisma.department.create({
            data: {
                tenantId,
                ...dto,
            },
        });
        await this.audit.log({
            tenantId,
            userId,
            eventKey: 'DEPARTMENT_CREATED',
            recordType: 'Department',
            recordId: department.id,
            newValues: department,
        });
        return department;
    }
    async createEmployee(tenantId, userId, dto) {
        const count = await this.prisma.employee.count({ where: { tenantId } });
        const employeeNumber = `EMP-${(count + 1).toString().padStart(5, '0')}`;
        const employee = await this.prisma.employee.create({
            data: {
                tenantId,
                employeeNumber,
                firstName: dto.firstName,
                lastName: dto.lastName,
                jobTitle: dto.jobTitle,
                departmentId: dto.departmentId,
                joiningDate: new Date(dto.joiningDate),
                salary: dto.salary,
                status: 'ACTIVE',
            },
        });
        await this.audit.log({
            tenantId,
            userId,
            eventKey: 'EMPLOYEE_CREATED',
            recordType: 'Employee',
            recordId: employee.id,
            newValues: employee,
        });
        return employee;
    }
    async generatePayslip(tenantId, userId, dto) {
        const employee = await this.prisma.employee.findFirst({
            where: { id: dto.employeeId, tenantId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found');
        }
        const basicSalary = Number(employee.salary);
        const netSalary = basicSalary + dto.totalAllowances - dto.totalDeductions;
        const payslip = await this.prisma.payslip.create({
            data: {
                tenantId,
                employeeId: dto.employeeId,
                periodStart: new Date(dto.periodStart),
                periodEnd: new Date(dto.periodEnd),
                basicSalary,
                totalAllowances: dto.totalAllowances,
                totalDeductions: dto.totalDeductions,
                netSalary,
                status: 'DRAFT',
            },
        });
        await this.audit.log({
            tenantId,
            userId,
            eventKey: 'PAYSLIP_GENERATED',
            recordType: 'Payslip',
            recordId: payslip.id,
            newValues: payslip,
        });
        return payslip;
    }
    async getEmployees(tenantId) {
        return this.prisma.employee.findMany({
            where: { tenantId },
            include: { department: true },
            orderBy: { lastName: 'asc' },
        });
    }
    async getDepartments(tenantId) {
        return this.prisma.department.findMany({
            where: { tenantId },
            include: { _count: { select: { employees: true } } },
            orderBy: { name: 'asc' },
        });
    }
};
exports.HrService = HrService;
exports.HrService = HrService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], HrService);
//# sourceMappingURL=hr.service.js.map