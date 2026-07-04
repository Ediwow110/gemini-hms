import { Module } from '@nestjs/common';
import { RetentionService } from './retention.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ComplianceModule } from '../../compliance/compliance.module';

/**
 * Module bundling scheduled maintenance tasks.
 * Imports PrismaModule (to list tenants) and ComplianceModule (to access
 * DataRetentionService). Import this module into AppModule to enable the
 * daily retention cron.
 */
@Module({
  imports: [PrismaModule, ComplianceModule],
  providers: [RetentionService],
  exports: [],
})
export class MaintenanceModule {}
