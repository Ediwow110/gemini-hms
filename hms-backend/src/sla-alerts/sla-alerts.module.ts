import { Module } from '@nestjs/common';
import { SlaAlertsService } from './sla-alerts.service';
import { SlaAlertsController } from './sla-alerts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, AnalyticsModule, NotificationsModule],
  controllers: [SlaAlertsController],
  providers: [SlaAlertsService],
  exports: [SlaAlertsService],
})
export class SlaAlertsModule {}
