import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('api/v1/notifications')
@UseGuards(PermissionsGuard)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private dispatcher: NotificationDispatcherService,
  ) {}

  @Get()
  @RequirePermissions('notification.view')
  async list(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.notificationsService.listNotifications(tenantId, userId, {
      status,
      category,
      priority,
      type,
      search,
    });
  }

  @Get('stats')
  @RequirePermissions('notification.view')
  async stats(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.notificationsService.getStats(tenantId, userId);
  }

  @Post(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
  ) {
    if (!userId) {
      throw new ForbiddenException('Access denied');
    }
    return this.notificationsService.markAsRead(id, tenantId, userId);
  }

  @Post('read-all')
  async markAllAsRead(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.notificationsService.markAllAsRead(tenantId, userId);
  }

  @Post('dispatch-pending')
  @RequirePermissions('notification.manage')
  async dispatchPending(@GetUser('tenantId') tenantId: string) {
    return this.dispatcher.dispatchPending(tenantId);
  }

  @Post(':id/retry')
  @RequirePermissions('notification.manage')
  async retry(@Param('id') id: string, @GetUser('tenantId') tenantId: string) {
    const result = await this.dispatcher.retryFailed(id, tenantId);
    return { success: result };
  }
}
