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
exports.QueueController = void 0;
const common_1 = require("@nestjs/common");
const queue_service_1 = require("./queue.service");
const queue_dto_1 = require("./dto/queue.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
let QueueController = class QueueController {
    queueService;
    constructor(queueService) {
        this.queueService = queueService;
    }
    join(tenantId, dto) {
        return this.queueService.joinQueue(tenantId, dto);
    }
    getDisplay(tenantId, branchId) {
        return this.queueService.getActiveDisplay(tenantId, branchId);
    }
    getWorklist(tenantId, serviceType) {
        return this.queueService.getWorklist(tenantId, serviceType);
    }
    updateStatus(tenantId, userId, id, dto) {
        return this.queueService.updateStatus(tenantId, userId, id, dto);
    }
};
exports.QueueController = QueueController;
__decorate([
    (0, common_1.Post)('join'),
    (0, permissions_decorator_1.RequirePermissions)('queue.manage'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, queue_dto_1.JoinQueueDto]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "join", null);
__decorate([
    (0, common_1.Get)('display'),
    (0, permissions_decorator_1.RequirePermissions)('queue.view'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "getDisplay", null);
__decorate([
    (0, common_1.Get)('worklist'),
    (0, permissions_decorator_1.RequirePermissions)('queue.view'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, common_1.Query)('serviceType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "getWorklist", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, permissions_decorator_1.RequirePermissions)('queue.manage'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, get_user_decorator_1.GetUser)('userId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, queue_dto_1.UpdateQueueStatusDto]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "updateStatus", null);
exports.QueueController = QueueController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('api/v1/queue'),
    __metadata("design:paramtypes", [queue_service_1.QueueService])
], QueueController);
//# sourceMappingURL=queue.controller.js.map