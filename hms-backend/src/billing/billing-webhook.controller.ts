import {
  BadRequestException,
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentGatewayService } from './payment-gateway.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

type RawBodyRequestType = RawBodyRequest<Request>;

@Controller('api/v1/billing/webhooks')
export class BillingWebhookController {
  constructor(
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: RawBodyRequestType,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    const result = await this.paymentGatewayService.handleStripeWebhook(
      rawBody,
      signature,
    );

    if (!result.success) {
      throw new BadRequestException(
        result.error || 'Webhook processing failed',
      );
    }

    return { received: true };
  }
}
