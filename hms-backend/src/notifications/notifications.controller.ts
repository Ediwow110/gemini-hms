import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';

import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private dispatcher: NotificationDispatcherService,
  ) {}

  @Get()
  async list(
    @Request() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.notificationsService.listNotifications(tenantId, {
      status,
      category,
      priority,
      type,
      search,
    });
  }

  @Get('stats')
  async stats(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.getStats(req.user.tenantId);
  }

  @Post(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!req.user.userId) {
      throw new ForbiddenException('Access denied');
    }
    return this.notificationsService.markAsRead(
      id,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Post('read-all')
  async markAllAsRead(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.markAllAsRead(req.user.tenantId);
  }

  @Post('dispatch-pending')
  async dispatchPending(@Request() req: AuthenticatedRequest) {
    return this.dispatcher.dispatchPending(req.user.tenantId);
  }

  @Post(':id/retry')
  async retry(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const result = await this.dispatcher.retryFailed(id, req.user.tenantId);
    return { success: result };
  }
}
