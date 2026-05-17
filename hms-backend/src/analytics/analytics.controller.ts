import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(RolesGuard)
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue')
  @Roles('Super Admin', 'Branch Admin', 'ANALYST', 'Analyst')
  async getRevenue(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getRevenue(tenantId);
  }

  @Get('diagnoses')
  @Roles('Super Admin', 'Branch Admin', 'ANALYST', 'Analyst')
  async getTopDiagnoses(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getTopDiagnoses(tenantId);
  }

  @Get('occupancy')
  @Roles('Super Admin', 'Branch Admin', 'ANALYST', 'Analyst')
  async getBedOccupancy(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getBedOccupancy(tenantId);
  }

  @Get('wait-time')
  @Roles('Super Admin', 'Branch Admin', 'ANALYST', 'Analyst')
  async getWaitTime(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getWaitTime(tenantId);
  }

  @Get('claim-rate')
  @Roles('Super Admin', 'Branch Admin', 'ANALYST', 'Analyst')
  async getClaimRate(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getClaimRate(tenantId);
  }
}
