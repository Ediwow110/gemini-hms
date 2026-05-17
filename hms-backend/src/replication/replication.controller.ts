import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ConflictResolverService, RegionalReplicaState } from './conflict-resolver.service';
import { RegionHealthService } from './region-health.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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
    @Query('entityType') entityType: string,
    @Query('since') since?: string,
  ) {
    return this.conflictService.detectConflicts(entityType, since);
  }

  @Post('sync/:entityType/:recordId')
  async syncRecord(
    @Param('entityType') entityType: string,
    @Param('recordId') recordId: string,
    @Body('targetRegion') targetRegion: string,
  ) {
    return this.conflictService.syncRecord(entityType, recordId, targetRegion);
  }

  @Post('resolve/:entityType/:recordId')
  async resolveConflict(
    @Param('entityType') entityType: string,
    @Param('recordId') recordId: string,
    @Body('stateA') stateA: RegionalReplicaState,
    @Body('stateB') stateB: RegionalReplicaState,
  ) {
    return this.conflictService.resolveConflict(entityType, recordId, stateA, stateB);
  }
}
