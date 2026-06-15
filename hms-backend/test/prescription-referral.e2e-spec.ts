import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ClinicalModule } from '../src/clinical/clinical.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { AuditModule } from '../src/audit/audit.module';
import { randomUUID } from 'crypto';
import {
  EncounterStatus,
  PrescriptionStatus,
  ReferralStatus,
  ReferralUrgency,
} from '@prisma/client';

describe('Prescription & Referral E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tenantId: string;
  let branchId: string;
  let patientId: string;
  let doctorId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        AuditModule,
        ClinicalModule,
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BranchGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalGuards(new MockJwtAuthGuard());
    await app.init();

    prisma = app.get(PrismaService);

    // Create unique tenant and branch
    const tenant = await prisma.tenant.create({
      data: { name: `Clinical-Tenant-${randomUUID()}` },
    });
    tenantId = tenant.id;

    const branch = await prisma.branch.create({
      data: {
        tenantId,
        name: 'Clinical Branch',
        code: `C-${randomUUID().substring(0, 4)}`,
      },
    });
    branchId = branch.id;

    // Create a Patient
    const patient = await prisma.patient.create({
      data: {
        tenantId,
        firstName: 'Bob',
        lastName: 'Jones',
        dob: new Date('1992-02-22'),
        patientNumber: `P-${randomUUID().substring(0, 8)}`,
        status: 'ACTIVE',
      },
    });
    patientId = patient.id;

    // Create a Doctor User
    doctorId = randomUUID();
    await prisma.user.create({
      data: {
        id: doctorId,
        tenantId,
        email: `doctor-${randomUUID()}@hms.local`,
        passwordHash: 'dummy',
        status: 'ACTIVE',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should manage prescriptions and referrals through their full lifecycles', async () => {
    // Setup Mock User as Cashier initially to check access restrictions
    MockJwtAuthGuard.user = {
      userId: doctorId,
      tenantId,
      branchId,
      roles: ['Cashier'],
      permissions: ['*'],
      email: 'cashier@hms.local',
    };

    // 1. Create an open encounter
    // We need to bypass RolesGuard to create the encounter first
    MockJwtAuthGuard.user.roles = ['Doctor'];
    const createEncounterRes = await request(app.getHttpServer())
      .post('/api/v1/clinical/encounters')
      .send({
        patientId,
        doctorId,
        chiefComplaint: 'Migraine and vision disturbance',
      })
      .expect(201);

    const encounterId = createEncounterRes.body.id;
    expect(encounterId).toBeDefined();

    // 2. Cashier attempts to create prescription -> 403
    MockJwtAuthGuard.user.roles = ['Cashier'];
    await request(app.getHttpServer())
      .post(`/api/v1/clinical/encounters/${encounterId}/prescriptions`)
      .send({
        medicationName: 'Sumatriptan 50mg',
        dosage: '1 tablet',
        frequency: 'As needed at onset',
        duration: '10 days',
      })
      .expect(403);

    // 3. Doctor creates prescription on open encounter -> 201
    MockJwtAuthGuard.user.roles = ['Doctor'];
    const createPrescRes = await request(app.getHttpServer())
      .post(`/api/v1/clinical/encounters/${encounterId}/prescriptions`)
      .send({
        medicationName: 'Sumatriptan 50mg',
        dosage: '1 tablet',
        frequency: 'As needed at onset',
        duration: '10 days',
        notes: 'Take with plenty of water',
      })
      .expect(201);

    const prescriptionId = createPrescRes.body.id;
    expect(prescriptionId).toBeDefined();
    expect(createPrescRes.body.status).toBe(PrescriptionStatus.ACTIVE);

    // 4. Nurse reads prescription -> 200
    MockJwtAuthGuard.user.roles = ['Nurse'];
    const getPrescRes = await request(app.getHttpServer())
      .get(`/api/v1/clinical/prescriptions/${prescriptionId}`)
      .expect(200);

    expect(getPrescRes.body.medicationName).toBe('Sumatriptan 50mg');
    expect(getPrescRes.body.patient.id).toBe(patientId);

    // 5. Doctor creates referral on open encounter -> 201
    MockJwtAuthGuard.user.roles = ['Doctor'];
    const createReferralRes = await request(app.getHttpServer())
      .post(`/api/v1/clinical/encounters/${encounterId}/referrals`)
      .send({
        referredToName: 'Dr. Jane Smith (Neurology)',
        specialty: 'Neurology',
        reason: 'Rule out cluster headache vs atypical migraine',
        urgency: ReferralUrgency.URGENT,
      })
      .expect(201);

    const referralId = createReferralRes.body.id;
    expect(referralId).toBeDefined();
    expect(createReferralRes.body.status).toBe(ReferralStatus.PENDING);

    // 6. Nurse reads referral -> 200
    MockJwtAuthGuard.user.roles = ['Nurse'];
    const getReferralRes = await request(app.getHttpServer())
      .get(`/api/v1/clinical/referrals/${referralId}`)
      .expect(200);

    expect(getReferralRes.body.referredToName).toBe(
      'Dr. Jane Smith (Neurology)',
    );

    // 7. Doctor cancels prescription -> status is CANCELLED (200)
    MockJwtAuthGuard.user.roles = ['Doctor'];
    const cancelPrescRes = await request(app.getHttpServer())
      .patch(`/api/v1/clinical/prescriptions/${prescriptionId}/cancel`)
      .expect(200);

    expect(cancelPrescRes.body.status).toBe(PrescriptionStatus.CANCELLED);

    // 8. Doctor updates referral status -> valid transition succeeds
    const updateReferralRes = await request(app.getHttpServer())
      .patch(`/api/v1/clinical/referrals/${referralId}/status`)
      .send({
        status: ReferralStatus.ACCEPTED,
      })
      .expect(200);

    expect(updateReferralRes.body.status).toBe(ReferralStatus.ACCEPTED);

    // 9. Doctor attempts an invalid transition from ACCEPTED back to PENDING -> 409
    await request(app.getHttpServer())
      .patch(`/api/v1/clinical/referrals/${referralId}/status`)
      .send({
        status: ReferralStatus.PENDING,
      })
      .expect(409);

    // 10. Close the encounter
    await request(app.getHttpServer())
      .patch(`/api/v1/clinical/encounters/${encounterId}/close`)
      .expect(200);

    // 11. Doctor attempts to create prescription on CLOSED encounter -> 409
    await request(app.getHttpServer())
      .post(`/api/v1/clinical/encounters/${encounterId}/prescriptions`)
      .send({
        medicationName: 'Ibuprofen 400mg',
        dosage: '1 tablet',
        frequency: 'Every 8 hours',
        duration: '5 days',
      })
      .expect(409);

    // 12. Doctor attempts to create referral on CLOSED encounter -> 409
    await request(app.getHttpServer())
      .post(`/api/v1/clinical/encounters/${encounterId}/referrals`)
      .send({
        referredToName: 'External Diagnostic Labs',
        specialty: 'Radiology',
        reason: 'Head CT Scan',
      })
      .expect(409);
  });
});
