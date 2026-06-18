import { Controller, Get, UseGuards } from '@nestjs/common';
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
}
