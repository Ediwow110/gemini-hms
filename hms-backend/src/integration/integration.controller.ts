import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import * as AuthTypes from '../common/types/authenticated-request.type';
import { IntegrationBridgesService } from './integration.service';

@Controller('api/v1/integration')
@UseGuards(PermissionsGuard)
export class IntegrationBridgesController {
  constructor(
    private readonly integrationBridgesService: IntegrationBridgesService,
  ) {}

  @Get('notifications')
  @RequirePermissions('notification.view')
  listNotifications(@GetUser() user: AuthTypes.RequestUser) {
    return this.integrationBridgesService.listNotifications(user);
  }

  @Get('approvals')
  @RequirePermissions('approval.request.view')
  listApprovals(@GetUser() user: AuthTypes.RequestUser) {
    return this.integrationBridgesService.listApprovals(user);
  }

  /** Shell endpoints — honest empty arrays until cross-domain sources exist */
  @Get('global-search')
  @RequirePermissions('notification.view')
  globalSearch(@Query('q') _q?: string) {
    return [];
  }

  @Get('patient-timeline')
  @RequirePermissions('patient.view')
  patientTimeline(@Query('patientId') _patientId?: string) {
    return [];
  }

  @Get('asset-timeline')
  @RequirePermissions('marketplace.buyer.view')
  assetTimeline(@Query('assetId') _assetId?: string) {
    return [];
  }

  @Get('reconciliation')
  @RequirePermissions('billing.invoice.view')
  reconciliation() {
    return [];
  }

  @Get('activity-audit')
  @RequirePermissions('audit.view')
  activityAudit(@GetUser() user: AuthTypes.RequestUser) {
    return this.integrationBridgesService.listActivityAudit(user);
  }
}
