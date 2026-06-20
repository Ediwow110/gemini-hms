import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ApprovalsModule } from '../approvals/approvals.module';
import { IntegrationBridgesController } from './integration.controller';
import { IntegrationBridgesService } from './integration.service';

@Module({
  imports: [NotificationsModule, ApprovalsModule],
  controllers: [IntegrationBridgesController],
  providers: [IntegrationBridgesService],
})
export class IntegrationBridgesModule {}
