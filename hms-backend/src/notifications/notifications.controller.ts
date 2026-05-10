import {
  Controller,
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

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private dispatcher: NotificationDispatcherService,
  ) {}

  @Get()
  async list(
    @Request() req: any,
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
  async stats(@Request() req: any) {
    return this.notificationsService.getStats(req.user.tenantId);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.tenantId);
  }

  @Post('read-all')
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.tenantId);
  }

  @Post('dispatch-pending')
  async dispatchPending(@Request() req: any) {
    return this.dispatcher.dispatchPending(req.user.tenantId);
  }

  @Post(':id/retry')
  async retry(@Param('id') id: string, @Request() req: any) {
    const result = await this.dispatcher.retryFailed(id, req.user.tenantId);
    return { success: result };
  }
}
