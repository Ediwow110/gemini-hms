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
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const billing_service_1 = require("./billing.service");
const payment_dto_1 = require("./dto/payment.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
let BillingController = class BillingController {
    billingService;
    constructor(billingService) {
        this.billingService = billingService;
    }
    postPayment(tenantId, userId, createPaymentDto) {
        return this.billingService.postPayment(tenantId, userId, createPaymentDto);
    }
    getInvoices(tenantId) {
        return this.billingService.getInvoices(tenantId);
    }
    openSession(tenantId, userId, dto) {
        return this.billingService.openSession(tenantId, userId, dto);
    }
    closeSession(tenantId, userId, sessionId, dto) {
        return this.billingService.closeSession(tenantId, userId, sessionId, dto);
    }
    getActiveSession(tenantId, userId) {
        return this.billingService.getActiveSession(tenantId, userId);
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Post)('payments'),
    (0, permissions_decorator_1.RequirePermissions)('billing.payment.create'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, get_user_decorator_1.GetUser)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "postPayment", null);
__decorate([
    (0, common_1.Get)('invoices'),
    (0, permissions_decorator_1.RequirePermissions)('billing.invoice.view'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getInvoices", null);
__decorate([
    (0, common_1.Post)('sessions/open'),
    (0, permissions_decorator_1.RequirePermissions)('billing.payment.create'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, get_user_decorator_1.GetUser)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, payment_dto_1.OpenSessionDto]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "openSession", null);
__decorate([
    (0, common_1.Patch)('sessions/:id/close'),
    (0, permissions_decorator_1.RequirePermissions)('billing.payment.create'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, get_user_decorator_1.GetUser)('userId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, payment_dto_1.CloseSessionDto]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "closeSession", null);
__decorate([
    (0, common_1.Get)('sessions/active'),
    (0, permissions_decorator_1.RequirePermissions)('billing.payment.create'),
    __param(0, (0, get_user_decorator_1.GetUser)('tenantId')),
    __param(1, (0, get_user_decorator_1.GetUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getActiveSession", null);
exports.BillingController = BillingController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('api/v1/billing'),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map