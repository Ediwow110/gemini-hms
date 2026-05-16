import { Module } from '@nestjs/common';
import { CashierService } from './cashier.service';
import { CashierController } from './cashier.controller';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [CashierController],
  providers: [CashierService, AuditService],
  exports: [CashierService],
})
export class CashierModule {}
