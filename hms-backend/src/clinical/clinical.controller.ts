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
import { BranchGuard } from '../auth/guards/branch.guard';
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
@UseGuards(RolesGuard, BranchGuard)
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
    return this.encounterService.createEncounter(
      tenantId,
      userId,
      branchId,
      dto,
    );
  }

  @Get('encounters/:id')
  @Roles('Doctor', 'Super Admin', 'Branch Admin', 'Receptionist', 'Nurse')
  @RequireBranchContext()
  async getEncounter(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.encounterService.getEncounter(tenantId, id, branchId);
  }

  @Patch('encounters/:id/close')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  @RequireBranchContext()
  async closeEncounter(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.encounterService.closeEncounter(tenantId, userId, id, branchId);
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
    return this.noteService.createNote(
      tenantId,
      userId,
      branchId,
      encounterId,
      dto,
    );
  }

  @Patch('notes/:id')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  @RequireBranchContext()
  async updateNote(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Param('id') noteId: string,
    @Body() dto: UpdateClinicalNoteDto,
  ) {
    return this.noteService.updateNote(tenantId, userId, noteId, dto, branchId);
  }

  @Post('notes/:id/lock')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  @RequireBranchContext()
  async lockNote(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Param('id') noteId: string,
  ) {
    return this.noteService.lockNote(tenantId, userId, noteId, branchId);
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
    return this.diagnosisService.attachDiagnosis(
      tenantId,
      userId,
      branchId,
      encounterId,
      dto,
    );
  }

  @Delete('encounters/:encounterId/diagnoses/:diagnosisId')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  @RequireBranchContext()
  async removeDiagnosis(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Param('encounterId') encounterId: string,
    @Param('diagnosisId') diagnosisId: string,
  ) {
    return this.diagnosisService.removeDiagnosis(
      tenantId,
      userId,
      encounterId,
      diagnosisId,
      undefined,
      branchId,
    );
  }

  @Delete('diagnoses/:id/restore')
  @Roles('Super Admin')
  async restoreDiagnosis(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.diagnosisService.restore(id, userId);
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
  @RequireBranchContext()
  async getPrescription(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.prescriptionService.getPrescription(tenantId, id, branchId);
  }

  @Patch('prescriptions/:id/cancel')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  @RequireBranchContext()
  async cancelPrescription(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.prescriptionService.cancelPrescription(
      tenantId,
      userId,
      id,
      branchId,
    );
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
  @RequireBranchContext()
  async getReferral(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.referralService.getReferral(tenantId, id, branchId);
  }

  @Patch('referrals/:id/status')
  @Roles('Doctor', 'Super Admin', 'Branch Admin')
  @RequireBranchContext()
  async updateReferralStatus(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateReferralStatusDto,
  ) {
    return this.referralService.updateReferralStatus(
      tenantId,
      userId,
      id,
      dto,
      branchId,
    );
  }
}
