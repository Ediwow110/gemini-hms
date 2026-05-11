import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Patch,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import {
  CreatePaymentDto,
  OpenSessionDto,
  CloseSessionDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard, BranchGuard)
@Controller('api/v1/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('payments')
  @RequirePermissions('billing.payment.create')
  @RequireBranchContext()
  postPayment(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.billingService.postPayment(
      tenantId,
      userId,
      branchId,
      createPaymentDto,
    );
  }

  @Get('invoices')
  @RequirePermissions('billing.invoice.view')
  @RequireBranchContext()
  getInvoices(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
  ) {
    return this.billingService.getInvoices(tenantId, branchId);
  }

  // --- Cashier Session Endpoints ---

  @Post('sessions/open')
  @RequirePermissions('billing.payment.create')
  @RequireBranchContext()
  openSession(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Body() dto: OpenSessionDto,
  ) {
    return this.billingService.openSession(tenantId, userId, branchId, dto);
  }

  @Patch('sessions/:id/close')
  @RequirePermissions('billing.payment.create')
  @RequireBranchContext()
  closeSession(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') sessionId: string,
    @Body() dto: CloseSessionDto,
  ) {
    return this.billingService.closeSession(
      tenantId,
      userId,
      branchId,
      sessionId,
      dto,
    );
  }

  @Get('sessions/active')
  @RequirePermissions('billing.payment.create')
  @RequireBranchContext()
  getActiveSession(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
  ) {
    return this.billingService.getActiveSession(tenantId, userId, branchId);
  }
}
