import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ConflictResolverService,
  RegionalReplicaState,
} from './conflict-resolver.service';
import { RegionHealthService } from './region-health.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';

@UseGuards(RolesGuard)
@Controller('api/v1/replication')
@Roles('Super Admin', 'Branch Admin')
export class ReplicationController {
  constructor(
    private readonly conflictService: ConflictResolverService,
    private readonly healthService: RegionHealthService,
  ) {}

  @Get('regions')
  async getRegions() {
    return this.healthService.getRegionStatus();
  }

  @Get('conflicts')
  async getConflicts(
    @GetUser('tenantId') tenantId: string,
    @Query('entityType') entityType: string,
    @Query('since') since?: string,
  ) {
    return this.conflictService.detectConflicts(tenantId, entityType, since);
  }

  @Post('sync/:entityType/:recordId')
  async syncRecord(
    @GetUser() user: RequestUser,
    @Param('entityType') entityType: string,
    @Param('recordId') recordId: string,
    @Body('targetRegion') targetRegion: string,
  ) {
    return this.conflictService.syncRecord(
      user.tenantId,
      user.userId!,
      entityType,
      recordId,
      targetRegion,
    );
  }

  @Post('resolve/:entityType/:recordId')
  async resolveConflict(
    @GetUser() user: RequestUser,
    @Param('entityType') entityType: string,
    @Param('recordId') recordId: string,
    @Body('stateA') stateA: RegionalReplicaState,
    @Body('stateB') stateB: RegionalReplicaState,
  ) {
    return this.conflictService.resolveConflict(
      user.tenantId,
      user.userId!,
      entityType,
      recordId,
      stateA,
      stateB,
    );
  }
}
