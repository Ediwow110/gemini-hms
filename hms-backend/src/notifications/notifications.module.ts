import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { AuditModule } from '../audit/audit.module';
import { BullQueueModule } from '../common/queue/bull-queue.module';
import { NotificationProcessor } from '../common/queue/example.processor';

@Module({
  imports: [AuditModule, BullQueueModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationDispatcherService,
    NotificationProcessor,
  ],
  exports: [NotificationsService, NotificationDispatcherService],
})
export class NotificationsModule {}
