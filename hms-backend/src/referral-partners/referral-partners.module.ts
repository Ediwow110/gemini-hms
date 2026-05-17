import { Module } from '@nestjs/common';
import { ReferralPartnersService } from './referral-partners.service';
import { ReferralPartnersController } from './referral-partners.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ReferralPartnersController],
  providers: [ReferralPartnersService],
  exports: [ReferralPartnersService],
})
export class ReferralPartnersModule {}
