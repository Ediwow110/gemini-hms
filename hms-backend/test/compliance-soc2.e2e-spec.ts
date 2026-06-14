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
import { ComplianceModule } from '../src/compliance/compliance.module';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { MockPermissionsGuard } from './helpers/mock-permissions.guard';

describe('SOC2 Type II Readiness (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const tenantId = '00000000-0000-0000-0000-00000000000c';

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        ComplianceModule,
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
    })
      .overrideGuard(PermissionsGuard)
      .useClass(MockPermissionsGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Upsert tenant
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: { id: tenantId, name: 'soc2-tenant', status: 'ACTIVE' },
    });
  });

  beforeEach(() => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId: tenantId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: ['*'],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };
  });

  it('should block non-Super Admin from accessing SOC2 reviews (403)', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId: tenantId,
      email: 'pharmacist@hospital.com',
      roles: ['Pharmacist'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/compliance/soc2/access-review')
      .expect(403);
  });

  it('should allow Super Admin to generate a comprehensive SOC2 access review report', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: ['*'],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/compliance/soc2/access-review')
      .expect(200)
      .expect((res) => {
        expect(res.body.reviewTimestamp).toBeDefined();
        expect(res.body.soc2ControlReference).toBe(
          'SOC2 CC6.1 - Access Rights Management',
        );
        expect(res.body.accessReport).toBeDefined();
        expect(res.body.staleAccountsCount).toBeDefined();
        expect(res.body.privilegeEscalationsCount).toBeDefined();
        expect(res.body.complianceStatus).toBeDefined();
      });
  });

  it('should detect stale accounts inactive for over 90 days', async () => {
    const staleUserId = '99999999-9999-9999-9999-999999999999';

    // Create a stale user
    await prisma.user.upsert({
      where: { id: staleUserId },
      update: {},
      create: {
        id: staleUserId,
        tenantId,
        email: 'stale-user@hospital.com',
        passwordHash: 'dummy-hash',
        status: 'ACTIVE',
        createdAt: new Date('2020-01-01'),
      },
    });

    // Seed session for user that is 100 days old
    const hundredDaysAgo = new Date();
    hundredDaysAgo.setDate(hundredDaysAgo.getDate() - 100);

    await prisma.session.create({
      data: {
        userId: staleUserId,
        tenantId,
        refreshTokenHash: `stale-token-hash-${Date.now()}`,
        expiresAt: new Date(),
        lastRotatedAt: hundredDaysAgo,
      },
    });

    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: ['*'],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/compliance/soc2/stale-accounts')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        const hasStaleUser = res.body.some(
          (u: { userId: string }) => u.userId === staleUserId,
        );
        expect(hasStaleUser).toBe(true);
      });
  });

  it('should compile deployment logs and schema migration changes inside the SOC2 changelog', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: ['*'],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/compliance/soc2/change-log')
      .expect(200)
      .expect((res) => {
        expect(res.body.soc2ControlReference).toBe(
          'SOC2 CC8.1 - Change Management Governing and Monitoring',
        );
        expect(res.body.deployments).toBeDefined();
        expect(res.body.schemaChanges).toBeDefined();
        expect(res.body.totalDeploymentsCount).toBeGreaterThanOrEqual(1);
        expect(res.body.totalSchemaChangesCount).toBeGreaterThanOrEqual(1);
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
