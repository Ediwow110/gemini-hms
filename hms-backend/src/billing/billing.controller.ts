import { Controller, Get, Post, Body, UseGuards, Param, Patch } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreatePaymentDto, OpenSessionDto, CloseSessionDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('payments')
  @RequirePermissions('billing.payment.create')
  postPayment(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() createPaymentDto: CreatePaymentDto
  ) {
    return this.billingService.postPayment(tenantId, userId, createPaymentDto);
  }

  @Get('invoices')
  @RequirePermissions('billing.invoice.view')
  getInvoices(@GetUser('tenantId') tenantId: string) {
    return this.billingService.getInvoices(tenantId);
  }

  // --- Cashier Session Endpoints ---

  @Post('sessions/open')
  @RequirePermissions('billing.payment.create')
  openSession(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: OpenSessionDto
  ) {
    return this.billingService.openSession(tenantId, userId, dto);
  }

  @Patch('sessions/:id/close')
  @RequirePermissions('billing.payment.create')
  closeSession(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') sessionId: string,
    @Body() dto: CloseSessionDto
  ) {
    return this.billingService.closeSession(tenantId, userId, sessionId, dto);
  }

  @Get('sessions/active')
  @RequirePermissions('billing.payment.create')
  getActiveSession(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string
  ) {
    return this.billingService.getActiveSession(tenantId, userId);
  }
}
