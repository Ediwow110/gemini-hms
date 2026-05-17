import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HipaaComplianceService } from './hipaa-compliance.service';
import { DataRetentionService } from './data-retention.service';
import { AccessReviewService } from './access-review.service';
import { ChangeManagementService } from './change-management.service';
import { ComplianceController } from './compliance.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ComplianceController],
  providers: [
    HipaaComplianceService,
    DataRetentionService,
    AccessReviewService,
    ChangeManagementService,
  ],
  exports: [
    HipaaComplianceService,
    DataRetentionService,
    AccessReviewService,
    ChangeManagementService,
  ],
})
export class ComplianceModule {}
