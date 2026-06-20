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
import { ClinicalModule } from '../src/clinical/clinical.module';
import { EncounterStatus, PrescriptionStatus } from '@prisma/client';

describe('Advanced Clinical EMR Features (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const tenantId = '00000000-0000-0000-0000-00000000000d';

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        ClinicalModule,
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

    // Ensure tenant exists
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: { id: tenantId, name: 'clinical-tenant', status: 'ACTIVE' },
    });
  });

  beforeEach(() => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId: tenantId,
      email: 'admin@hms.local',
      roles: ['Super Admin'],
      permissions: ['*'],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };
  });

  it('should prevent unauthorized role from accessing advanced clinical features (403)', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId,
      email: 'patient@portal.com',
      roles: ['Patient'], // Unauthorized role
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/clinical/cpt-codes')
      .expect(403);
  });

  it('should search CPT codes by code or description', async () => {
    // Seed CPT Codes
    await prisma.cptCode.upsert({
      where: { tenantId_code: { tenantId, code: '99213' } },
      update: {},
      create: {
        tenantId,
        code: '99213',
        description: 'Outpatient doctor visit, 15 minutes',
        category: 'Evaluation and Management',
        fees: 75.0,
      },
    });

    await prisma.cptCode.upsert({
      where: { tenantId_code: { tenantId, code: '36415' } },
      update: {},
      create: {
        tenantId,
        code: '36415',
        description: 'Collection of venous blood by venipuncture',
        category: 'Surgery / Pathology',
        fees: 15.0,
      },
    });

    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId,
      email: 'doctor@hospital.com',
      roles: ['Doctor'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/clinical/cpt-codes?search=venous')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].code).toBe('36415');
      });
  });

  it('should trigger drug-interaction safety warnings for contraindicated combinations', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId,
      email: 'doctor@hospital.com',
      roles: ['Doctor'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .post('/api/v1/clinical/erx/screen-interactions')
      .send({
        patientId: '22222222-2222-4222-8222-222222222222',
        medications: ['Sildenafil', 'Nitroglycerin Spray', 'Aspirin'],
      })
      .expect(201)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].severity).toBe('CONTRAINDICATED');
        expect(res.body[0].drugs).toContain('Sildenafil');
      });
  });

  it('should successfully stub prescription NCPDP transmission and lifecycle updates', async () => {
    const doctorId = '11111111-1111-4111-8111-111111111112';
    const branchId = '33333333-3333-4333-8333-333333333333';
    const patientId = '44444444-4444-4444-8444-444444444444';
    const encounterId = '55555555-5555-4555-8555-555555555555';
    const prescriptionId = '66666666-6666-4666-8666-666666666666';

    // Seed dependencies
    await prisma.branch.upsert({
      where: { id: branchId },
      update: {},
      create: {
        id: branchId,
        tenantId,
        name: 'clinic-branch',
        code: 'BR-CLINIC',
      },
    });

    await prisma.user.upsert({
      where: { id: doctorId },
      update: {},
      create: {
        id: doctorId,
        tenantId,
        email: 'doctor@hospital.com',
        passwordHash: 'dummy',
        status: 'ACTIVE',
      },
    });

    await prisma.patient.upsert({
      where: { id: patientId },
      update: {},
      create: {
        id: patientId,
        tenantId,
        patientNumber: 'P-CLINIC',
        firstName: 'Jane',
        lastName: 'Doe',
        dob: new Date(),
        status: 'ACTIVE',
      },
    });

    await prisma.encounter.upsert({
      where: { id: encounterId },
      update: {},
      create: {
        id: encounterId,
        tenantId,
        branchId,
        patientId,
        attendingId: doctorId,
        doctorId,
        status: EncounterStatus.OPEN,
        createdBy: doctorId,
        updatedBy: doctorId,
      },
    });

    await prisma.prescription.upsert({
      where: { id: prescriptionId },
      update: {},
      create: {
        id: prescriptionId,
        tenantId,
        branchId,
        encounterId,
        prescribedById: doctorId,
        patientId,
        medicationName: 'Amoxicillin 500mg',
        dosage: '1 tablet',
        frequency: 'Three times daily',
        duration: '7 days',
        notes: 'Take with food.',
        status: PrescriptionStatus.ACTIVE,
      },
    });

    MockJwtAuthGuard.user = {
      userId: doctorId,
      tenantId,
      email: 'doctor@hospital.com',
      roles: ['Doctor'],
      permissions: [],
      branchId,
    };

    await request(app.getHttpServer())
      .post(`/api/v1/clinical/erx/transmit/${prescriptionId}`)
      .expect(501)
      .expect((res) => {
        expect(res.body.statusCode).toBe(501);
        expect(res.body.error).toBe('Not Implemented');
        expect(res.body.message).toContain('Not Implemented');
        expect(res.body.message).toContain('NCPDP');
      });

    await request(app.getHttpServer())
      .get(`/api/v1/clinical/erx/transmission/NCPDP-TX-12345/status`)
      .expect(501)
      .expect((res) => {
        expect(res.body.statusCode).toBe(501);
        expect(res.body.error).toBe('Not Implemented');
        expect(res.body.message).toContain('Not Implemented');
      });
  });

  it('should assign and release clinical bed occupancy and compute statistics', async () => {
    const patientId = '44444444-4444-4444-8444-444444444444';
    const wardId = 'ward-cardiology';
    const bedNumber = 'bed-10A';

    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId,
      email: 'doctor@hospital.com',
      roles: ['Doctor'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    // Assign bed
    await request(app.getHttpServer())
      .post('/api/v1/clinical/beds/assign')
      .send({ patientId, wardId, bedNumber })
      .expect(201)
      .expect((res) => {
        expect(res.body.bedId).toBe(
          `${tenantId}:${MockJwtAuthGuard.user.branchId}:${wardId}-${bedNumber}`,
        );
      });

    // Check occupancy
    await request(app.getHttpServer())
      .get('/api/v1/clinical/beds/occupancy')
      .expect(200)
      .expect((res) => {
        expect(res.body.occupiedCount).toBe(1);
        expect(res.body.occupancyRate).toBeGreaterThan(0);
      });

    // Release bed
    await request(app.getHttpServer())
      .post(`/api/v1/clinical/beds/release/${wardId}-${bedNumber}`)
      .expect(201)
      .expect((res) => {
        expect(res.body.released).toBe(true);
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
