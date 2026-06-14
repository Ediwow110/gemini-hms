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

describe('HIPAA Compliance Automation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const tenantId = '00000000-0000-0000-0000-00000000000a';
  const otherTenantId = '00000000-0000-0000-0000-00000000000b';

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

    // Ensure tenants exist
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: { id: tenantId, name: 'hipaa-tenant-a', status: 'ACTIVE' },
    });
    await prisma.tenant.upsert({
      where: { id: otherTenantId },
      update: {},
      create: { id: otherTenantId, name: 'hipaa-tenant-b', status: 'ACTIVE' },
    });

    // Ensure user exists for audit log foreign key constraint
    const userId = '11111111-1111-4111-8111-111111111112';
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        tenantId,
        email: 'admin@hospital.com',
        passwordHash: 'dummy-hash',
        status: 'ACTIVE',
      },
    });
  });

  beforeEach(() => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId: tenantId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: ['*'],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };
  });

  it('should block non-Super Admin from accessing ePHI audits (403)', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId,
      email: 'nurse@hospital.com',
      roles: ['Nurse'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/compliance/hipaa/ephi-audit')
      .expect(403);
  });

  it('should allow Super Admin to fetch ePHI audits and return only tenant data', async () => {
    const userId = '11111111-1111-4111-8111-111111111112';

    // Seed audit logs representing ePHI access
    await prisma.auditLog.createMany({
      data: [
        {
          tenantId,
          userId,
          eventKey: 'PATIENT_VIEWED',
          recordType: 'Patient',
          recordId: '22222222-2222-2222-2222-222222222222',
          hash: 'hash-a',
          createdAt: new Date(),
        },
        {
          tenantId: otherTenantId,
          userId,
          eventKey: 'PATIENT_VIEWED',
          recordType: 'Patient',
          recordId: '33333333-3333-3333-3333-333333333333',
          hash: 'hash-b',
          createdAt: new Date(),
        },
      ],
    });

    MockJwtAuthGuard.user = {
      userId,
      tenantId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: ['*'],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/compliance/hipaa/ephi-audit')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        // Verify cross-tenant containment
        const hasOtherTenant = res.body.some(
          (log: { tenantId: string }) => log.tenantId === otherTenantId,
        );
        expect(hasOtherTenant).toBe(false);
        const hasOurTenant = res.body.some(
          (log: { tenantId: string }) => log.tenantId === tenantId,
        );
        expect(hasOurTenant).toBe(true);
      });
  });

  it('should generate a structured HIPAA-compliant breach report for an incident', async () => {
    const userId = '11111111-1111-4111-8111-111111111112';

    const breachLog = await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        eventKey: 'UNAUTHORIZED_EXFILTRATION_BREACH',
        recordType: 'Patient',
        recordId: '22222222-2222-2222-2222-222222222222',
        hash: 'hash-c',
        createdAt: new Date(),
      },
    });

    MockJwtAuthGuard.user = {
      userId,
      tenantId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: ['*'],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get(`/api/v1/compliance/hipaa/breach-report/${breachLog.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.incidentId).toBe(breachLog.id);
        expect(res.body.tenantId).toBe(tenantId);
        expect(res.body.ephiTypeInvolved).toBeDefined();
        expect(res.body.discoveryDate).toBeDefined();
        expect(res.body.mitigationStepsTaken).toBeDefined();
        expect(res.body.regulatoryReportedStatus).toBe(
          'PENDING_HHS_NOTIFICATION',
        );
      });
  });

  it('should enforce data retention policy by soft-archiving records older than 6 years', async () => {
    const userId = '11111111-1111-4111-8111-111111111112';

    // Seed old patient record using raw execute to set date back 7 years ago
    const patientId = '55555555-5555-5555-5555-555555555555';
    await prisma.patient.upsert({
      where: { id: patientId },
      update: {},
      create: {
        id: patientId,
        tenantId,
        patientNumber: 'P-9999',
        firstName: 'Old',
        lastName: 'Patient',
        dob: new Date('1980-01-01'),
        status: 'ACTIVE',
      },
    });

    const sevenYearsAgo = new Date();
    sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

    // Update patient created date using executeRaw
    await prisma.$executeRawUnsafe(
      `UPDATE patients SET created_at = $1 WHERE id = $2`,
      sevenYearsAgo,
      patientId,
    );

    MockJwtAuthGuard.user = {
      userId,
      tenantId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: ['*'],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    // Trigger enforcement
    await request(app.getHttpServer())
      .post('/api/v1/compliance/retention/enforce')
      .expect(201)
      .expect((res) => {
        expect(res.body.archivedPatientsCount).toBeGreaterThanOrEqual(1);
      });

    // Check status
    await request(app.getHttpServer())
      .get('/api/v1/compliance/retention/status')
      .expect(200)
      .expect((res) => {
        expect(res.body.patients.archived).toBeGreaterThanOrEqual(1);
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
