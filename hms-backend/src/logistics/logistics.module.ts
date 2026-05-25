import { Module } from '@nestjs/common';
import { InstallationController } from './installation.controller';
import { InstallationService } from './installation.service';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [InstallationController, LogisticsController],
  providers: [InstallationService, LogisticsService],
  exports: [InstallationService, LogisticsService],
})
export class LogisticsModule {}
