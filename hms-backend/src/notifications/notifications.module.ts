import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { AuditModule } from '../audit/audit.module';
import { BullQueueModule } from '../common/queue/bull-queue.module';
import { NotificationProcessor } from '../common/queue/example.processor';

@Module({
  imports: [AuditModule, BullQueueModule, ConfigModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationDispatcherService,
    SmsService,
    EmailService,
    NotificationProcessor,
  ],
  exports: [
    NotificationsService,
    NotificationDispatcherService,
    SmsService,
    EmailService,
  ],
})
export class NotificationsModule {}
