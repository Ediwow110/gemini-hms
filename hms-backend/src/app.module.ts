import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { PatientsModule } from './patients/patients.module';
import { OrdersModule } from './orders/orders.module';
import { BillingModule } from './billing/billing.module';
import { LabModule } from './lab/lab.module';
import { InventoryModule } from './inventory/inventory.module';
import { HrModule } from './hr/hr.module';
import { QueueModule } from './queue/queue.module';
import { ClaimsModule } from './claims/claims.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { NumberingModule } from './numbering/numbering.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    AuditModule,
    PatientsModule,
    OrdersModule,
    BillingModule,
    LabModule,
    InventoryModule,
    HrModule,
    QueueModule,
    ClaimsModule,
    ApprovalsModule,
    NumberingModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
