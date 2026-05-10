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
exports.LabController = void 0;
const common_1 = require("@nestjs/common");
const lab_service_1 = require("./lab.service");
const lab_dto_1 = require("./dto/lab.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
let LabController = class LabController {
    labService;
    constructor(labService) {
        this.labService = labService;
    }
    getWorklist(tenantId) {
        return this.labService.getPendingWorklist(tenantId);
    }
    findOne(tenantId, id) {
        return this.labService.findOne(tenantId, id);
    }
    encode(tenantId, userId, id, dto) {
        return this.labService.encodeResult(tenantId, userId, id, dto);
    }
    approve(tenantId, userId, id, dto) {
        return this.labService.approveResult(tenantId, userId, id, dto);
    }
    release(tenantId, userId, id) {
        return this.labService.releaseResult(tenantId, userId, id);
    }
    amend(tenantId, userId, id, dto) {
        return this.labService.requestAmendment(tenantId, userId, id, dto);
    }
};
exports.LabController = LabController;
__decorate([
    (0, common_1.Get)('worklist'),
    (0, permissions_decorator_1.RequirePermissions)('lab.result.view'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LabController.prototype, "getWorklist", null);
__decorate([
    (0, common_1.Get)('results/:id'),
    (0, permissions_decorator_1.RequirePermissions)('lab.result.view'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LabController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('results/:id/encode'),
    (0, permissions_decorator_1.RequirePermissions)('lab.result.encode'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, get_user_decorator_1.GetUser)('userId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, lab_dto_1.EncodeLabResultDto]),
    __metadata("design:returntype", void 0)
], LabController.prototype, "encode", null);
__decorate([
    (0, common_1.Patch)('results/:id/approve'),
    (0, permissions_decorator_1.RequirePermissions)('lab.result.approve'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, get_user_decorator_1.GetUser)('userId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, lab_dto_1.ApproveLabResultDto]),
    __metadata("design:returntype", void 0)
], LabController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)('results/:id/release'),
    (0, permissions_decorator_1.RequirePermissions)('lab.result.release'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, get_user_decorator_1.GetUser)('userId')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], LabController.prototype, "release", null);
__decorate([
    (0, common_1.Post)('results/:id/amend'),
    (0, permissions_decorator_1.RequirePermissions)('lab.result.amend'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, get_user_decorator_1.GetUser)('userId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, lab_dto_1.AmendLabResultDto]),
    __metadata("design:returntype", void 0)
], LabController.prototype, "amend", null);
exports.LabController = LabController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('api/v1/lab'),
    __metadata("design:paramtypes", [lab_service_1.LabService])
], LabController);
//# sourceMappingURL=lab.controller.js.map