import {
  Controller,
  Post,
  Patch,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';

@Controller('emr/encounters')
@UseGuards(JwtAuthGuard, PermissionsGuard)
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
  async updateStatus(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEncounterStatusDto,
  ) {
    return this.encounterService.updateStatus(tenantId, userId, id, dto.status);
  }

  @Get(':id')
  @RequirePermissions('encounter.view')
  async findOne(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.encounterService.findOne(tenantId, id);
  }

  @Post(':id/vitals')
  @RequirePermissions('encounter.update')
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

  @Post(':id/notes')
  @RequirePermissions('clinical_note.create')
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
