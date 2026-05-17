import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ClinicalModule } from '../src/clinical/clinical.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { AuditModule } from '../src/audit/audit.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { AuditContextMiddleware } from '../src/audit/audit-context.middleware';
import { randomUUID } from 'crypto';

describe('Audit Log Forensic Context (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantId: string;
  let branchId: string;
  let patientId: string;
  let doctorId: string;
  let sessionUuid: string;

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
    
    // Bind AuditContextMiddleware manually to global express routes for E2E
    app.use(new AuditContextMiddleware().use);

    await app.init();

    prisma = app.get(PrismaService);

    // Create unique tenant and branch
    const tenant = await prisma.tenant.create({
      data: { name: `Audit-Forensic-Tenant-${randomUUID()}` },
    });
    tenantId = tenant.id;

    const branch = await prisma.branch.create({
      data: {
        tenantId,
        name: 'Forensic Branch',
        code: `F-${randomUUID().substring(0, 4)}`,
      },
    });
    branchId = branch.id;

    // Create a Patient
    const patient = await prisma.patient.create({
      data: {
        tenantId,
        firstName: 'Bob',
        lastName: 'Jones',
        dob: new Date('1990-01-01'),
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
        email: `doc-forensic-${randomUUID()}@hms.local`,
        passwordHash: 'dummy',
        status: 'ACTIVE',
      },
    });

    sessionUuid = randomUUID();
  });

  it('should capture ip, user-agent, role, and sessionId in audit logs on clinical action', async () => {
    // 1. Setup mock user context
    MockJwtAuthGuard.user.userId = doctorId;
    MockJwtAuthGuard.user.tenantId = tenantId;
    MockJwtAuthGuard.user.branchId = branchId;
    MockJwtAuthGuard.user.roles = ['Doctor'];
    (MockJwtAuthGuard.user as any).role = 'Doctor';
    (MockJwtAuthGuard.user as any).sessionId = sessionUuid;

    // 2. Create encounter
    const encounterRes = await request(app.getHttpServer())
      .post('/clinical/encounters')
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; ForensicAgent)')
      .set('X-Forwarded-For', '203.0.113.195')
      .send({
        patientId,
        chiefComplaint: 'Sore throat',
      })
      .expect(201);

    const encounterId = encounterRes.body.id;

    // 3. Find the created audit log in db
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        eventKey: 'CLINICAL_ENCOUNTER_CREATED',
      },
    });

    expect(auditLogs.length).toBe(1);
    const log = auditLogs[0];

    // 4. Assert forensic fields are perfectly captured!
    expect(log.ipAddress).toBe('203.0.113.195');
    expect(log.userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; ForensicAgent)');
    expect(log.activeRole).toBe('Doctor');
    expect(log.sessionId).toBe(sessionUuid);
  });

  afterAll(async () => {
    await app.close();
  });
});
