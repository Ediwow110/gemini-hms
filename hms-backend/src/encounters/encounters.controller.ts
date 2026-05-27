import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EncountersService } from './encounters.service';
import { CreateEncounterDto, UpdateEncounterDto } from './dto/encounter.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';
import { BranchGuard } from '../auth/guards/branch.guard';

@Controller('encounters')
@UseGuards(PermissionsGuard, BranchGuard)
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) {}

  @Post()
  @RequirePermissions('encounter.create')
  @RequireBranchContext()
  async create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Body() dto: CreateEncounterDto,
  ) {
    return this.encountersService.create(tenantId, userId, branchId, dto);
  }

  @Get()
  @RequirePermissions('encounter.view')
  @RequireBranchContext()
  async findAll(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') userBranchId: string | undefined,
    @GetUser('roles') roles: string[] | undefined,
    @Query('branchId') requestedBranchId?: string,
    @Query('patientId') patientId?: string,
  ) {
    const branchId = roles?.includes('Super Admin')
      ? requestedBranchId
      : userBranchId;
    return this.encountersService.findAll(tenantId, branchId, patientId);
  }

  @Get(':id')
  @RequirePermissions('encounter.view')
  @RequireBranchContext()
  async findOne(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.encountersService.findOne(tenantId, id, branchId);
  }

  @Patch(':id')
  @RequirePermissions('encounter.update')
  @RequireBranchContext()
  async update(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateEncounterDto,
  ) {
    return this.encountersService.update(tenantId, userId, id, dto, branchId);
  }
}
