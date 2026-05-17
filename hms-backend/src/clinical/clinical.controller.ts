import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { EncounterService } from './encounter.service';
import { ClinicalNoteService } from './clinical-note.service';
import { DiagnosisService } from './diagnosis.service';
import { PrescriptionService } from './prescription.service';
import { ReferralService } from './referral.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';
import {
  CreateEncounterDto,
  CreateClinicalNoteDto,
  UpdateClinicalNoteDto,
  AttachDiagnosisDto,
  CreatePrescriptionDto,
  CreateReferralDto,
  UpdateReferralStatusDto,
} from './dto/clinical.dto';

@Controller('clinical')
@UseGuards(RolesGuard)
export class ClinicalController {
  constructor(
    private readonly encounterService: EncounterService,
    private readonly noteService: ClinicalNoteService,
    private readonly diagnosisService: DiagnosisService,
    private readonly prescriptionService: PrescriptionService,
    private readonly referralService: ReferralService,
  ) {}

  @Post('encounters')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  @RequireBranchContext()
  async createEncounter(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Body() dto: CreateEncounterDto,
  ) {
    return this.encounterService.createEncounter(tenantId, userId, branchId, dto);
  }

  @Get('encounters/:id')
  @Roles('Doctor', 'Super Admin', 'Branch Admin', 'Receptionist', 'Nurse')
  async getEncounter(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.encounterService.getEncounter(tenantId, id);
  }

  @Patch('encounters/:id/close')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  async closeEncounter(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.encounterService.closeEncounter(tenantId, userId, id);
  }

  @Post('encounters/:id/notes')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  @RequireBranchContext()
  async createNote(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') encounterId: string,
    @Body() dto: CreateClinicalNoteDto,
  ) {
    return this.noteService.createNote(tenantId, userId, branchId, encounterId, dto);
  }

  @Patch('notes/:id')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  async updateNote(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') noteId: string,
    @Body() dto: UpdateClinicalNoteDto,
  ) {
    return this.noteService.updateNote(tenantId, userId, noteId, dto);
  }

  @Post('notes/:id/lock')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  async lockNote(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') noteId: string,
  ) {
    return this.noteService.lockNote(tenantId, userId, noteId);
  }

  @Post('encounters/:id/diagnoses')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  @RequireBranchContext()
  async attachDiagnosis(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') encounterId: string,
    @Body() dto: AttachDiagnosisDto,
  ) {
    return this.diagnosisService.attachDiagnosis(tenantId, userId, branchId, encounterId, dto);
  }

  @Delete('encounters/:encounterId/diagnoses/:diagnosisId')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  async removeDiagnosis(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('encounterId') encounterId: string,
    @Param('diagnosisId') diagnosisId: string,
  ) {
    return this.diagnosisService.removeDiagnosis(tenantId, userId, encounterId, diagnosisId);
  }

  @Post('encounters/:id/prescriptions')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  @RequireBranchContext()
  async createPrescription(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') encounterId: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.prescriptionService.createPrescription(
      tenantId,
      userId,
      branchId,
      encounterId,
      dto,
    );
  }

  @Get('prescriptions/:id')
  @Roles('Doctor', 'Super Admin', 'Branch Admin', 'Nurse')
  async getPrescription(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.prescriptionService.getPrescription(tenantId, id);
  }

  @Patch('prescriptions/:id/cancel')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  async cancelPrescription(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.prescriptionService.cancelPrescription(tenantId, userId, id);
  }

  @Post('encounters/:id/referrals')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  @RequireBranchContext()
  async createReferral(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') encounterId: string,
    @Body() dto: CreateReferralDto,
  ) {
    return this.referralService.createReferral(
      tenantId,
      userId,
      branchId,
      encounterId,
      dto,
    );
  }

  @Get('referrals/:id')
  @Roles('Doctor', 'Super Admin', 'Branch Admin', 'Nurse')
  async getReferral(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.referralService.getReferral(tenantId, id);
  }

  @Patch('referrals/:id/status')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  async updateReferralStatus(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReferralStatusDto,
  ) {
    return this.referralService.updateReferralStatus(tenantId, userId, id, dto);
  }
}
