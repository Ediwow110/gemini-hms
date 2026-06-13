import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ComplianceController } from './compliance.controller';
import { HipaaComplianceService } from './hipaa-compliance.service';
import { DataRetentionService } from './data-retention.service';
import { AccessReviewService } from './access-review.service';
import { ChangeManagementService } from './change-management.service';
import { AuditChainMonitorService } from './audit-chain-monitor.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ComplianceController],
  providers: [
    HipaaComplianceService,
    DataRetentionService,
    AccessReviewService,
    ChangeManagementService,
    AuditChainMonitorService,
  ],
  exports: [
    HipaaComplianceService,
    DataRetentionService,
    AccessReviewService,
    ChangeManagementService,
  ],
})
export class ComplianceModule {}
