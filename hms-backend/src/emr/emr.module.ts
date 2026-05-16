import { Module } from '@nestjs/common';
import { EncounterService } from './encounter.service';
import { EncounterController } from './encounter.controller';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [EncounterController],
  providers: [EncounterService, AuditService],
  exports: [EncounterService],
})
export class EmrModule {}
