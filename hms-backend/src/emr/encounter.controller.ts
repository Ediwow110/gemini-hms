import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Get,
} from '@nestjs/common';
import { EncounterService } from './encounter.service';
import {
  CreateEncounterDto,
  UpdateEncounterStatusDto,
  CreateVitalsDto,
  CreateDiagnosisDto,
  CreateClinicalNoteDto,
} from './dto/encounter.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';
import { BranchGuard } from '../auth/guards/branch.guard';

@Controller('api/v1/emr/encounters')
@UseGuards(PermissionsGuard, BranchGuard)
export class EncounterController {
  constructor(private readonly encounterService: EncounterService) {}

  @Post()
  @RequirePermissions('encounter.create')
  @RequireBranchContext()
  async create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Body() dto: CreateEncounterDto,
  ) {
    return this.encounterService.create(tenantId, userId, branchId, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('encounter.update')
  @RequireBranchContext()
  async updateStatus(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateEncounterStatusDto,
  ) {
    return this.encounterService.updateStatus(
      tenantId,
      userId,
      id,
      dto.status,
      branchId,
    );
  }

  @Get(':id')
  @RequirePermissions('encounter.view')
  @RequireBranchContext()
  async findOne(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.encounterService.findOne(tenantId, id, branchId);
  }

  @Post(':id/vitals')
  @RequirePermissions('encounter.update')
  @RequireBranchContext()
  async addVitals(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') encounterId: string,
    @Body() dto: CreateVitalsDto,
  ) {
    return this.encounterService.addVitals(
      tenantId,
      userId,
      branchId,
      encounterId,
      dto,
    );
  }

  @Post(':id/diagnoses')
  @RequirePermissions('encounter.update')
  @RequireBranchContext()
  async addDiagnosis(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') encounterId: string,
    @Body() dto: CreateDiagnosisDto,
  ) {
    return this.encounterService.addDiagnosis(
      tenantId,
      userId,
      branchId,
      encounterId,
      dto,
    );
  }

  @Delete(':id/diagnoses/:diagnosisId')
  @RequirePermissions('encounter.update')
  @RequireBranchContext()
  async removeDiagnosis(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') encounterId: string,
    @Param('diagnosisId') diagnosisId: string,
  ) {
    return this.encounterService.removeDiagnosis(
      tenantId,
      userId,
      branchId,
      encounterId,
      diagnosisId,
    );
  }

  @Post(':id/notes')
  @RequirePermissions('clinical_note.create')
  @RequireBranchContext()
  async addNote(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') encounterId: string,
    @Body() dto: CreateClinicalNoteDto,
  ) {
    return this.encounterService.addClinicalNote(
      tenantId,
      userId,
      branchId,
      encounterId,
      dto,
    );
  }
}
