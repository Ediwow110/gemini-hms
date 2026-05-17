import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ClinicalModule } from '../src/clinical/clinical.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { AuditModule } from '../src/audit/audit.module';
import { randomUUID } from 'crypto';
import { EncounterStatus } from '@prisma/client';

describe('Clinical Encounter & SOAP Notes E2E', () => {
  let app: INestApplication;
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
        firstName: 'Alice',
        lastName: 'Smith',
        dob: new Date('1985-05-15'),
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

    // Seed an ICD-10 Code
    await prisma.icd10Code.upsert({
      where: { code: 'A09' },
      update: {},
      create: {
        code: 'A09',
        description: 'Infectious gastroenteritis and colitis, unspecified',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should enforce access controls and perform full SOAP and diagnosis workflows', async () => {
    // 1. Cashier attempts to create encounter -> 403
    MockJwtAuthGuard.user = {
      userId: doctorId,
      tenantId,
      branchId,
      roles: ['Cashier'],
      permissions: ['*'],
      email: 'cashier@hms.local',
    };

    await request(app.getHttpServer())
      .post('/clinical/encounters')
      .send({
        patientId,
        doctorId,
        chiefComplaint: 'Severe stomach pain',
      })
      .expect(403);

    // 2. Doctor creates encounter -> 201
    MockJwtAuthGuard.user.roles = ['Doctor'];
    const createRes = await request(app.getHttpServer())
      .post('/clinical/encounters')
      .send({
        patientId,
        doctorId,
        chiefComplaint: 'Severe stomach pain',
      })
      .expect(201);

    const encounterId = createRes.body.id;
    expect(encounterId).toBeDefined();
    expect(createRes.body.status).toBe(EncounterStatus.OPEN);

    // 3. Nurse reads encounter -> 200
    MockJwtAuthGuard.user.roles = ['Nurse'];
    const getRes = await request(app.getHttpServer())
      .get(`/clinical/encounters/${encounterId}`)
      .expect(200);

    expect(getRes.body.chiefComplaint).toBe('Severe stomach pain');

    // 4. Doctor adds SOAP note to open encounter -> 201
    MockJwtAuthGuard.user.roles = ['Doctor'];
    const noteRes = await request(app.getHttpServer())
      .post(`/clinical/encounters/${encounterId}/notes`)
      .send({
        subjective: 'Patient reports nausea and vomiting for 2 days.',
        objective: 'Abdominal tenderness in epigastrium.',
        assessment: 'Suspected acute gastroenteritis.',
        plan: 'Hydration and oral rehydration salts.',
      })
      .expect(201);

    const noteId = noteRes.body.id;
    expect(noteId).toBeDefined();

    // 5. Doctor locks note -> 201
    await request(app.getHttpServer())
      .post(`/clinical/notes/${noteId}/lock`)
      .expect(201);

    // 6. Doctor attempts to update locked note -> 409 (Conflict)
    await request(app.getHttpServer())
      .patch(`/clinical/notes/${noteId}`)
      .send({ subjective: 'Updated text' })
      .expect(409);

    // 7. ICD-10 code is attached to open encounter -> 201
    const diagRes = await request(app.getHttpServer())
      .post(`/clinical/encounters/${encounterId}/diagnoses`)
      .send({
        icd10Code: 'A09',
        isPrimary: true,
        notes: 'Primary diagnosis',
      })
      .expect(201);

    expect(diagRes.body.id).toBeDefined();
    expect(diagRes.body.icd10Code.code).toBe('A09');
    const diagnosisId = diagRes.body.id;

    // Remove diagnosis -> should soft-delete and return 200
    await request(app.getHttpServer())
      .delete(`/clinical/encounters/${encounterId}/diagnoses/${diagnosisId}`)
      .expect(200);

    // Get encounter -> diagnoses list should be empty (since it's filtered by deletedAt: null)
    MockJwtAuthGuard.user.roles = ['Doctor'];
    const encounterAfterDelete = await request(app.getHttpServer())
      .get(`/clinical/encounters/${encounterId}`)
      .expect(200);
    expect(encounterAfterDelete.body.encounterDiagnoses.length).toBe(0);

    // Verify DB record still exists but is marked as deleted
    const rawDbRecord = await prisma.encounterDiagnosis.findUnique({
      where: { id: diagnosisId },
    });
    expect(rawDbRecord).not.toBeNull();
    expect(rawDbRecord.deletedAt).not.toBeNull();
    expect(rawDbRecord.deleteReason).toBe('administrative_removal');

    // Restore diagnosis (Super Admin only)
    MockJwtAuthGuard.user.roles = ['Super Admin'];
    await request(app.getHttpServer())
      .delete(`/clinical/diagnoses/${diagnosisId}/restore`)
      .expect(200);

    // Get encounter again -> diagnosis should be present again!
    MockJwtAuthGuard.user.roles = ['Doctor'];
    const encounterAfterRestore = await request(app.getHttpServer())
      .get(`/clinical/encounters/${encounterId}`)
      .expect(200);
    expect(encounterAfterRestore.body.encounterDiagnoses.length).toBe(1);
    expect(encounterAfterRestore.body.encounterDiagnoses[0].id).toBe(diagnosisId);

    // 8. Close the encounter
    await request(app.getHttpServer())
      .patch(`/clinical/encounters/${encounterId}/close`)
      .expect(200);

    // 9. Encounter is closed -> diagnoses cannot be added -> 409
    await request(app.getHttpServer())
      .post(`/clinical/encounters/${encounterId}/diagnoses`)
      .send({
        icd10Code: 'A09',
      })
      .expect(409);
  });
});
