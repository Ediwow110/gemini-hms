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
  @Roles('Super Admin', 'Branch Admin', 'Compliance Officer')
  async getRevenue(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getRevenue(tenantId);
  }

  @Get('diagnoses')
  @Roles('Super Admin', 'Branch Admin', 'Compliance Officer')
  async getTopDiagnoses(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getTopDiagnoses(tenantId);
  }

  @Get('occupancy')
  @Roles('Super Admin', 'Branch Admin', 'Compliance Officer')
  async getBedOccupancy(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getBedOccupancy(tenantId);
  }

  @Get('wait-time')
  @Roles('Super Admin', 'Branch Admin', 'Compliance Officer')
  async getWaitTime(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getWaitTime(tenantId);
  }

  @Get('claim-rate')
  @Roles('Super Admin', 'Branch Admin', 'Compliance Officer')
  async getClaimRate(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getClaimRate(tenantId);
  }

  @Get('hr-metrics')
  @Roles('Super Admin', 'HR Manager', 'HR Staff')
  async getHrMetrics(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getHrMetrics(tenantId);
  }

  @Get('it-metrics')
  @Roles('Super Admin', 'IT Support')
  async getItMetrics(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getItMetrics(tenantId);
  }

  @Get('marketplace-metrics')
  @Roles('Super Admin', 'Marketplace Admin')
  async getMarketplaceMetrics(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getMarketplaceMetrics(tenantId);
  }

  @Get('compliance-metrics')
  @Roles('Super Admin', 'Compliance Officer')
  async getComplianceMetrics(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getComplianceMetrics(tenantId);
  }
}
