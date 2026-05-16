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
import { ServiceCatalogModule } from './catalog/service-catalog.module';
import { HrModule } from './hr/hr.module';
import { QueueModule } from './queue/queue.module';
import { ClaimsModule } from './claims/claims.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { NumberingModule } from './numbering/numbering.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { EncountersModule } from './encounters/encounters.module';
import { LisModule } from './lis/lis.module';

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
    ServiceCatalogModule,
    HrModule,
    QueueModule,
    ClaimsModule,
    ApprovalsModule,
    NumberingModule,
    NotificationsModule,
    ReportsModule,
    AdminModule,
    EncountersModule,
    LisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
