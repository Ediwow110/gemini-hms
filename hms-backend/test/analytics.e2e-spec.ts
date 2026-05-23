import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { AnalyticsModule } from '../src/analytics/analytics.module';
import { randomUUID } from 'crypto';

describe('Advanced Analytics Module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const tenantId = '00000000-0000-0000-0000-00000000000c';

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        AnalyticsModule,
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

    // Upsert tenant for context
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: {
        id: tenantId,
        name: 'analytics-tenant',
        status: 'ACTIVE',
      },
    });
  });

  it('should prevent unauthorized role from accessing analytics/revenue', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId: tenantId,
      email: 'nurse@hospital.com',
      roles: ['NURSE'], // Unauthorized role
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/analytics/revenue')
      .expect(403);
  });

  it('should allow ANALYST role to get revenue stats', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId: tenantId,
      email: 'analyst@hospital.com',
      roles: ['ANALYST'], // Authorized role
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/analytics/revenue')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('should allow ADMIN role to get top diagnoses stats', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111113',
      tenantId: tenantId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/analytics/diagnoses')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('should allow ANALYST role to get bed occupancy rate', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId: tenantId,
      email: 'analyst@hospital.com',
      roles: ['ANALYST'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/analytics/occupancy')
      .expect(200)
      .expect((res) => {
        expect(res.body.tenantId).toBe(tenantId);
        expect(res.body.totalBeds).toBe(150);
        expect(res.body.occupiedBeds).toBe(68);
        expect(res.body.utilizationRate).toBe(0.4533);
      });
  });

  it('should allow ANALYST role to get average patient wait time', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId: tenantId,
      email: 'analyst@hospital.com',
      roles: ['ANALYST'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/analytics/wait-time')
      .expect(200)
      .expect((res) => {
        expect(res.body.averageWaitTimeMinutes).toBeDefined();
      });
  });

  it('should allow ANALYST role to get insurance claim approval/rejection rate', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId: tenantId,
      email: 'analyst@hospital.com',
      roles: ['ANALYST'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/analytics/claim-rate')
      .expect(200)
      .expect((res) => {
        expect(res.body.totalClaims).toBeDefined();
        expect(res.body.approvalRate).toBeDefined();
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
