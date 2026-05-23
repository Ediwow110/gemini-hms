import { Module } from '@nestjs/common';
import { InstallationController } from './installation.controller';
import { InstallationService } from './installation.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [InstallationController],
  providers: [InstallationService],
  exports: [InstallationService],
})
export class InstallationModule {}
