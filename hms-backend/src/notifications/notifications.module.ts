import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationDispatcherService],
  exports: [NotificationsService, NotificationDispatcherService],
})
export class NotificationsModule {}
