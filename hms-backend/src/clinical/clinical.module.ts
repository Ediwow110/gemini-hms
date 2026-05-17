import { Module } from '@nestjs/common';
import { EncounterService } from './encounter.service';
import { ClinicalNoteService } from './clinical-note.service';
import { DiagnosisService } from './diagnosis.service';
import { ClinicalController } from './clinical.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ClinicalController],
  providers: [EncounterService, ClinicalNoteService, DiagnosisService],
  exports: [EncounterService, ClinicalNoteService, DiagnosisService],
})
export class ClinicalModule {}
