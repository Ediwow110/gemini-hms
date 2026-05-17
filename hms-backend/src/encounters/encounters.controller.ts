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

@Controller('encounters')
@UseGuards(PermissionsGuard)
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
  async findAll(
    @GetUser('tenantId') tenantId: string,
    @Query('branchId') branchId?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.encountersService.findAll(tenantId, branchId, patientId);
  }

  @Get(':id')
  @RequirePermissions('encounter.view')
  async findOne(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.encountersService.findOne(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('encounter.update')
  async update(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEncounterDto,
  ) {
    return this.encountersService.update(tenantId, userId, id, dto);
  }
}
