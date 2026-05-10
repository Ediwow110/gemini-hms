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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HrController = void 0;
const common_1 = require("@nestjs/common");
const hr_service_1 = require("./hr.service");
const hr_dto_1 = require("./dto/hr.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let HrController = class HrController {
    hrService;
    constructor(hrService) {
        this.hrService = hrService;
    }
    getDepartments(tenantId) {
        return this.hrService.getDepartments(tenantId);
    }
    createDepartment(tenantId, userId, dto) {
        return this.hrService.createDepartment(tenantId, userId, dto);
    }
    getEmployees(tenantId) {
        return this.hrService.getEmployees(tenantId);
    }
    createEmployee(tenantId, userId, dto) {
        return this.hrService.createEmployee(tenantId, userId, dto);
    }
    generatePayslip(tenantId, userId, dto) {
        return this.hrService.generatePayslip(tenantId, userId, dto);
    }
};
exports.HrController = HrController;
__decorate([
    (0, common_1.Get)('departments'),
    (0, roles_decorator_1.Roles)('Super Admin', 'Branch Admin', 'HR'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "getDepartments", null);
__decorate([
    (0, common_1.Post)('departments'),
    (0, roles_decorator_1.Roles)('Super Admin', 'Branch Admin', 'HR'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, get_user_decorator_1.GetUser)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, hr_dto_1.CreateDepartmentDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "createDepartment", null);
__decorate([
    (0, common_1.Get)('employees'),
    (0, roles_decorator_1.Roles)('Super Admin', 'Branch Admin', 'HR'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "getEmployees", null);
__decorate([
    (0, common_1.Post)('employees'),
    (0, roles_decorator_1.Roles)('Super Admin', 'Branch Admin', 'HR'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, get_user_decorator_1.GetUser)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, hr_dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "createEmployee", null);
__decorate([
    (0, common_1.Post)('payroll/generate'),
    (0, roles_decorator_1.Roles)('Super Admin', 'Branch Admin', 'HR'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, get_user_decorator_1.GetUser)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, hr_dto_1.CreatePayslipDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "generatePayslip", null);
exports.HrController = HrController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/v1/hr'),
    __metadata("design:paramtypes", [hr_service_1.HrService])
], HrController);
//# sourceMappingURL=hr.controller.js.map