import { Module } from '@nestjs/common';
import { InsuranceClaimService } from './insurance-claim.service';
import { InsuranceClaimController } from './insurance-claim.controller';
import { StubInsuranceProvider } from './providers/stub-insurance.provider';
import { LedgerModule } from '../ledger/ledger.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, LedgerModule],
  controllers: [InsuranceClaimController],
  providers: [
    InsuranceClaimService,
    {
      provide: 'InsuranceProvider',
      useClass: StubInsuranceProvider,
    },
  ],
  exports: [InsuranceClaimService],
})
export class InsuranceModule {}
