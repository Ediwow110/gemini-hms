import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { PatientsModule } from '../src/patients/patients.module';
import { NumberingModule } from '../src/numbering/numbering.module';
import { AuditModule } from '../src/audit/audit.module';
import { TenantGuard } from '../src/auth/guards/tenant.guard';
import { randomUUID } from 'crypto';

describe('Multi-Tenancy Row-Level Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const tenantAlphaId = '00000000-0000-0000-0000-00000000000a';
  const tenantBetaId = '00000000-0000-0000-0000-00000000000b';

  let patientAlphaId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        NumberingModule,
        AuditModule,
        PatientsModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: MockJwtAuthGuard,
        },
        {
          provide: APP_GUARD,
          useClass: TenantGuard,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BranchGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Upsert demo tenants in test database
    await prisma.tenant.upsert({
      where: { id: tenantAlphaId },
      update: {},
      create: {
        id: tenantAlphaId,
        name: 'tenant-alpha',
        status: 'ACTIVE',
      },
    });

    await prisma.tenant.upsert({
      where: { id: tenantBetaId },
      update: {},
      create: {
        id: tenantBetaId,
        name: 'tenant-beta',
        status: 'ACTIVE',
      },
    });

    // Clean up existing patients under test IDs if any
    await prisma.patient.deleteMany({
      where: {
        tenantId: { in: [tenantAlphaId, tenantBetaId] },
      },
    });

    // Create a patient under tenant-alpha
    patientAlphaId = randomUUID();
    await prisma.patient.create({
      data: {
        id: patientAlphaId,
        tenantId: tenantAlphaId,
        patientNumber: `PT-A-${randomUUID().substring(0, 8)}`,
        firstName: 'Alpha',
        lastName: 'Patient',
        dob: new Date(),
      },
    });
  });

  it('should fail with 400 if X-Tenant-ID header is missing and no user auth', async () => {
    const oldUser = MockJwtAuthGuard.user;
    (MockJwtAuthGuard as any).user = null;

    await request(app.getHttpServer())
      .get(`/api/v1/patients/${patientAlphaId}`)
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain('X-Tenant-ID header is missing');
      });

    MockJwtAuthGuard.user = oldUser;
  });

  it('should fail with 404 if X-Tenant-ID header contains non-existent tenant', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId: '00000000-0000-0000-0000-000000000099',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: ['*'],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get(`/api/v1/patients/${patientAlphaId}`)
      .set('X-Tenant-ID', '00000000-0000-0000-0000-000000000099')
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toContain('Tenant not found');
      });
  });

  it('should successfully read tenant-alpha patient with tenant-alpha header & user context', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId: tenantAlphaId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: ['*'],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get(`/api/v1/patients/${patientAlphaId}`)
      .set('X-Tenant-ID', tenantAlphaId)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(patientAlphaId);
        expect(res.body.firstName).toBe('Alpha');
      });
  });

  it('should prevent cross-tenant access and throw 403 when authenticated user for tenant-beta tries to pass tenant-alpha header', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId: tenantBetaId,
      email: 'beta-admin@hospital.com',
      roles: ['Super Admin'],
      permissions: ['*'],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get(`/api/v1/patients/${patientAlphaId}`)
      .set('X-Tenant-ID', tenantAlphaId)
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toContain('Cross-tenant access forbidden');
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
