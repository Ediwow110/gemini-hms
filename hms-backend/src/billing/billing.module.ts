import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { ApprovalsModule } from '../approvals/approvals.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [ApprovalsModule, LedgerModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
