import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { HipaaComplianceService } from './hipaa-compliance.service';
import { DataRetentionService } from './data-retention.service';
import { AccessReviewService } from './access-review.service';
import { ChangeManagementService } from './change-management.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(RolesGuard)
@Controller('api/v1/compliance')
@Roles('Super Admin', 'Branch Admin')
export class ComplianceController {
  constructor(
    private readonly hipaaService: HipaaComplianceService,
    private readonly retentionService: DataRetentionService,
    private readonly accessReviewService: AccessReviewService,
    private readonly changeService: ChangeManagementService,
  ) {}

  // 8A - HIPAA Compliance Automation Endpoints
  @Get('hipaa/ephi-audit')
  async getEphiAudit(
    @GetUser('tenantId') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.hipaaService.auditEphiAccess(tenantId, from, to);
  }

  @Get('hipaa/breach-report/:incidentId')
  async getBreachReport(
    @GetUser('tenantId') tenantId: string,
    @Param('incidentId') incidentId: string,
  ) {
    return this.hipaaService.generateBreachReport(tenantId, incidentId);
  }

  @Get('retention/status')
  async getRetentionStatus() {
    return this.retentionService.getRetentionStatus();
  }

  @Post('retention/enforce')
  async enforceRetention() {
    return this.retentionService.enforceRetention();
  }

  // 8B - SOC2 Type II Readiness Endpoints
  @Get('soc2/access-review')
  async getAccessReview(@GetUser('tenantId') tenantId: string) {
    return this.accessReviewService.generateAccessReviewReport(tenantId);
  }

  @Get('soc2/stale-accounts')
  async getStaleAccounts(@GetUser('tenantId') tenantId: string) {
    return this.accessReviewService.detectStaleAccounts(tenantId, 90);
  }

  @Get('soc2/change-log')
  async getChangeLog(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.changeService.generateChangeLog(from, to);
  }
}
