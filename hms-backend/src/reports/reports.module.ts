import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportPolicyService } from './report-policy.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportPolicyService],
  exports: [ReportsService],
})
export class ReportsModule {}
