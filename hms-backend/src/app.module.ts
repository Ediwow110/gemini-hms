import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PhiMaskingInterceptor } from './common/interceptors/phi-masking.interceptor';
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
import { CatalogModule } from './catalog/catalog.module';
import { HrModule } from './hr/hr.module';
import { QueueModule } from './queue/queue.module';
import { ClaimsModule } from './claims/claims.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { NumberingModule } from './numbering/numbering.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { EncountersModule } from './encounters/encounters.module';
import { EmrModule } from './emr/emr.module';
import { ClinicalModule } from './clinical/clinical.module';
import { PatientPortalModule } from './patient-portal/patient-portal.module';
import { LedgerModule } from './ledger/ledger.module';
import { InsuranceModule } from './insurance/insurance.module';
import { ProcurementModule } from './procurement/procurement.module';
import { ReferralPartnersModule } from './referral-partners/referral-partners.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { MfaGuard } from './auth/guards/mfa.guard';
import { TenantGuard } from './auth/guards/tenant.guard';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { AuditContextMiddleware } from './audit/audit-context.middleware';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 100 },
      { name: 'auth', ttl: 60000, limit: 5 },
      { name: 'sensitive', ttl: 60000, limit: 20 },
    ]),
    PrismaModule,
    AuthModule,
    AuditModule,
    PatientsModule,
    OrdersModule,
    BillingModule,
    LabModule,
    InventoryModule,
    CatalogModule,
    HrModule,
    QueueModule,
    ClaimsModule,
    ApprovalsModule,
    NumberingModule,
    NotificationsModule,
    ReportsModule,
    AdminModule,
    EncountersModule,
    EmrModule,
    ClinicalModule,
    PatientPortalModule,
    LedgerModule,
    InsuranceModule,
    ProcurementModule,
    ReferralPartnersModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // FAIL-CLOSED: Authentication and Throttling are global by default
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: MfaGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_INTERCEPTOR, useClass: PhiMaskingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditContextMiddleware).forRoutes('*');
  }
}
