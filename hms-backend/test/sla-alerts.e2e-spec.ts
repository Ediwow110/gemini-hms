import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { SlaAlertsModule } from '../src/sla-alerts/sla-alerts.module';
import { SlaAlertsService } from '../src/sla-alerts/sla-alerts.service';

describe('Real-Time SLA Alerts and Notifications (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let slaService: SlaAlertsService;

  const tenantId = '00000000-0000-0000-0000-00000000000e';

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        SlaAlertsModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: MockJwtAuthGuard,
        },
        {
          provide: APP_GUARD,
          useClass: RolesGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    slaService = app.get(SlaAlertsService);

    // Upsert tenant for test
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: {
        id: tenantId,
        name: 'sla-tenant',
        status: 'ACTIVE',
      },
    });

    // Cleanup existing queue entries and alerts for this tenant
    await prisma.slaAlert.deleteMany({ where: { tenantId } });
    await prisma.queueEntry.deleteMany({ where: { tenantId } });
    await prisma.notification.deleteMany({ where: { tenantId } });
  });

  it('should detect wait-time breach, create alert, dispatch high priority SMS, and let admin acknowledge it', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    // 1. Seed a queue entry that was completed 20 minutes after creation (SLA threshold is 15 minutes)
    const now = new Date();
    const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);

    await prisma.queueEntry.create({
      data: {
        tenantId,
        branchId: '123e4567-e89b-12d3-a456-426614174001',
        queueNumber: 'SLA-001',
        serviceType: 'REGULAR',
        status: 'COMPLETED',
        createdAt: twentyMinutesAgo,
        updatedAt: now,
      },
    });

    // 2. Perform SLA check
    const alert = await slaService.checkSlaThresholds(tenantId);
    expect(alert).toBeDefined();
    expect(alert!.metricName).toBe('WAIT_TIME');
    expect(alert!.actualValue).toBe(20.0);
    expect(alert!.thresholdValue).toBe(15.0);
    expect(alert!.status).toBe('TRIGGERED');

    // 3. Verify notification dispatcher created high priority system notification
    const notifications = await prisma.notification.findMany({
      where: { tenantId, priority: 'HIGH' },
    });
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].recipient).toBe('+15550199');
    expect(notifications[0].content).toContain('20 minutes');

    // 4. Retrieve active alerts via API
    let activeAlerts: any[] = [];
    await request(app.getHttpServer())
      .get('/api/v1/sla-alerts')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        activeAlerts = res.body;
      });

    // 5. Acknowledge alert via API
    await request(app.getHttpServer())
      .patch(`/api/v1/sla-alerts/${activeAlerts[0].id}/acknowledge`)
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ACKNOWLEDGED');
      });

    // 6. Verify it is no longer listed in active alerts
    await request(app.getHttpServer())
      .get('/api/v1/sla-alerts')
      .expect(200)
      .expect((res) => {
        expect(res.body.length).toBe(0);
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
