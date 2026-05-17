import { Module } from '@nestjs/common';
import { EncounterService } from './encounter.service';
import { ClinicalNoteService } from './clinical-note.service';
import { DiagnosisService } from './diagnosis.service';
import { PrescriptionService } from './prescription.service';
import { ReferralService } from './referral.service';
import { ClinicalController } from './clinical.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ErxService } from './erx.service';
import { BedManagementService } from './bed-management.service';
import { AdvancedClinicalController } from './advanced-clinical.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ClinicalController, AdvancedClinicalController],
  providers: [
    EncounterService,
    ClinicalNoteService,
    DiagnosisService,
    PrescriptionService,
    ReferralService,
    ErxService,
    BedManagementService,
  ],
  exports: [
    EncounterService,
    ClinicalNoteService,
    DiagnosisService,
    PrescriptionService,
    ReferralService,
    ErxService,
    BedManagementService,
  ],
})
export class ClinicalModule {}
