import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingWebhookController } from './billing-webhook.controller';
import { PaymentGatewayService } from './payment-gateway.service';
import { ApprovalsModule } from '../approvals/approvals.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [ConfigModule, ApprovalsModule, LedgerModule],
  controllers: [BillingController, BillingWebhookController],
  providers: [BillingService, PaymentGatewayService],
  exports: [PaymentGatewayService],
})
export class BillingModule {}
