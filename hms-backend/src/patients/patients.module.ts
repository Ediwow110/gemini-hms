import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { PatientMergeRequestService } from './patient-merge-request.service';
import { PatientMergeRequestController } from './patient-merge-request.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [PatientsController, PatientMergeRequestController],
  providers: [PatientsService, PatientMergeRequestService],
})
export class PatientsModule {}
