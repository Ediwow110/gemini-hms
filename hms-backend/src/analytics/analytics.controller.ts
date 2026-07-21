import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(PermissionsGuard)
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue')
  @RequirePermissions(
    'admin.metrics.view',
    'billing.invoice.view',
    'compliance.report.export',
  )
  async getRevenue(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getRevenue(tenantId);
  }

  @Get('diagnoses')
  @RequirePermissions(
    'admin.metrics.view',
    'encounter.view',
    'compliance.audit.review',
  )
  async getTopDiagnoses(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getTopDiagnoses(tenantId);
  }

  @Get('occupancy')
  @RequirePermissions(
    'admin.metrics.view',
    'encounter.view',
    'compliance.audit.review',
  )
  async getBedOccupancy(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getBedOccupancy(tenantId);
  }

  @Get('wait-time')
  @RequirePermissions(
    'admin.metrics.view',
    'queue.view',
    'compliance.audit.review',
  )
  async getWaitTime(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getWaitTime(tenantId);
  }

  @Get('claim-rate')
  @RequirePermissions(
    'admin.metrics.view',
    'billing.claim.view',
    'compliance.report.export',
  )
  async getClaimRate(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getClaimRate(tenantId);
  }

  @Get('hr-metrics')
  @RequirePermissions(
    'admin.metrics.view',
    'hr.employee.view',
    'hr.payroll.view',
  )
  async getHrMetrics(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getHrMetrics(tenantId);
  }

  @Get('it-metrics')
  @RequirePermissions('admin.metrics.view', 'it.system.view')
  async getItMetrics(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getItMetrics(tenantId);
  }

  @Get('marketplace-metrics')
  @RequirePermissions('admin.metrics.view', 'marketplace.admin.view')
  async getMarketplaceMetrics(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getMarketplaceMetrics(tenantId);
  }

  @Get('compliance-metrics')
  @RequirePermissions('admin.metrics.view', 'compliance.audit.review')
  async getComplianceMetrics(@GetUser('tenantId') tenantId: string) {
    return this.analyticsService.getComplianceMetrics(tenantId);
  }
}
