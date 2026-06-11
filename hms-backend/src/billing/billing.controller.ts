import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UseGuards,
  Param,
  Patch,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import {
  CreatePaymentDto,
  OpenSessionDto,
  CloseSessionDto,
  LogReceiptEventDto,
} from './dto/payment.dto';
import { RefundRequestDto, VoidRequestDto } from './dto/reversal.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';

@UseGuards(PermissionsGuard, BranchGuard)
@Controller('api/v1/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('refunds/request')
  @RequirePermissions('billing.refund.request')
  @RequireBranchContext()
  requestRefund(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Body() dto: RefundRequestDto,
  ) {
    return this.billingService.requestRefund(tenantId, userId, branchId, dto);
  }

  @Post('payments/void-request')
  @RequirePermissions('billing.payment.void.request')
  @RequireBranchContext()
  requestVoid(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Body() dto: VoidRequestDto,
  ) {
    return this.billingService.requestVoid(tenantId, userId, branchId, dto);
  }

  @Post('payments/:id/void')
  @RequirePermissions('billing.payment.void.request')
  @RequireBranchContext()
  requestVoidNew(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') paymentId: string,
    @Body() body: { reason: string },
  ) {
    return this.billingService.requestVoid(tenantId, userId, branchId, {
      paymentId,
      reason: body.reason,
    });
  }

  @Patch('payments/voids/:id/approve')
  @RequirePermissions('billing.reversal.apply')
  @RequireBranchContext()
  approveVoid(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') reversalId: string,
    @Body() body: { remarks?: string },
  ) {
    return this.billingService.approveVoid(
      tenantId,
      userId,
      branchId,
      reversalId,
      body,
    );
  }

  @Patch('payments/voids/:id/reject')
  @RequirePermissions('billing.reversal.apply')
  @RequireBranchContext()
  rejectVoid(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') reversalId: string,
    @Body() body: { remarks?: string },
  ) {
    return this.billingService.rejectVoid(
      tenantId,
      userId,
      branchId,
      reversalId,
      body,
    );
  }

  @Post('invoices/:id/refund')
  @RequirePermissions('billing.refund.request')
  @RequireBranchContext()
  requestRefundNew(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') invoiceId: string,
    @Body() body: { paymentId: string; amount: number; reason: string },
  ) {
    return this.billingService.requestRefund(tenantId, userId, branchId, {
      paymentId: body.paymentId,
      amount: body.amount,
      reason: body.reason,
    });
  }

  @Patch('refunds/:id/approve')
  @RequirePermissions('billing.reversal.apply')
  @RequireBranchContext()
  approveRefund(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') reversalId: string,
    @Body() body: { remarks?: string },
  ) {
    return this.billingService.approveRefund(
      tenantId,
      userId,
      branchId,
      reversalId,
      body,
    );
  }

  @Patch('refunds/:id/reject')
  @RequirePermissions('billing.reversal.apply')
  @RequireBranchContext()
  rejectRefund(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') reversalId: string,
    @Body() body: { remarks?: string },
  ) {
    return this.billingService.rejectRefund(
      tenantId,
      userId,
      branchId,
      reversalId,
      body,
    );
  }

  @Post('payments')
  @RequirePermissions('billing.payment.create')
  @RequireBranchContext()
  postPayment(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    if (
      'idempotencyKey' in
      (createPaymentDto as unknown as { idempotencyKey?: unknown })
    ) {
      throw new BadRequestException(
        'Idempotency-Key must be provided via header only',
      );
    }

    if (!idempotencyKey?.trim()) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    return this.billingService.postPayment(
      tenantId,
      userId,
      branchId,
      createPaymentDto,
      idempotencyKey,
    );
  }

  @Post('reversals/:id/apply')
  @RequirePermissions('billing.reversal.apply')
  @RequireBranchContext()
  applyReversal(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') reversalId: string,
  ) {
    return this.billingService.applyReversal(
      tenantId,
      userId,
      branchId,
      reversalId,
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

  @Post('receipts/event')
  @RequirePermissions('billing.payment.create')
  @RequireBranchContext()
  logReceiptEvent(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Body() dto: LogReceiptEventDto,
  ) {
    return this.billingService.logReceiptEvent(tenantId, userId, branchId, dto);
  }
}
