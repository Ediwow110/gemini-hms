import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { LabModule } from '../src/lab/lab.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { randomUUID } from 'crypto';

describe('Lab Result Release Transaction (e2e)', () => {
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
        LabModule,
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
      data: { name: `Lab-Release-Tenant-${randomUUID()}` },
    });
    tenantId = tenant.id;

    const branch = await prisma.branch.create({
      data: {
        tenantId,
        name: 'Lab Release Branch',
        code: `LR-${randomUUID().substring(0, 4)}`,
      },
    });
    branchId = branch.id;

    // Create a Patient
    const patient = await prisma.patient.create({
      data: {
        tenantId,
        firstName: 'Charlie',
        lastName: 'Brown',
        dob: new Date('2000-01-01'),
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
        email: `doc-lab-${randomUUID()}@hms.local`,
        passwordHash: 'dummy',
        status: 'ACTIVE',
      },
    });
  });

  it('should enforce proper release constraints and transactionally update everything', async () => {
    MockJwtAuthGuard.user.userId = doctorId;
    MockJwtAuthGuard.user.tenantId = tenantId;
    MockJwtAuthGuard.user.branchId = branchId;

    // 1. Create a Lab Order and pending Lab Result
    const order = await prisma.order.create({
      data: {
        tenantId,
        branchId,
        patientId,
        orderNumber: `ORD-${randomUUID().substring(0, 8)}`,
        status: 'DRAFT',
      },
    });

    const labResult = await prisma.labResult.create({
      data: {
        tenantId,
        orderId: order.id,
        status: 'PENDING_COLLECTION',
      },
    });

    // 2. Try to release unapproved result -> 400 Bad Request
    await request(app.getHttpServer())
      .post(`/api/v1/lab/results/${labResult.id}/release`)
      .expect(400);

    // 3. Mark the lab result as APPROVED in DB
    await prisma.labResult.update({
      where: { id: labResult.id },
      data: { status: 'APPROVED' },
    });

    // 4. Release the result successfully -> 201 Created (Nest POST default)
    const releaseRes = await request(app.getHttpServer())
      .post(`/api/v1/lab/results/${labResult.id}/release`)
      .expect(201);

    expect(releaseRes.body.status).toBe('RELEASED');
    expect(releaseRes.body.lockedAt).toBeDefined();

    // 5. Assert that Order status is updated to 'RELEASED'
    const dbOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(dbOrder.status).toBe('RELEASED');

    // 6. Assert that LabResultSignature record was transactionally created
    const signature = await prisma.labResultSignature.findUnique({
      where: { labResultId: labResult.id },
    });
    expect(signature).not.toBeNull();
    expect(signature.signedById).toBe(doctorId);
    expect(signature.signatureHash).toBeDefined();

    // 7. Assert that NotificationOutbox record was transactionally created
    const outbox = await prisma.notificationOutbox.findFirst({
      where: { recipientId: patientId, type: 'LAB_RESULT_READY' },
    });
    expect(outbox).not.toBeNull();
    expect(outbox.status).toBe('PENDING');
    const payload = JSON.parse(outbox.payload);
    expect(payload.resultId).toBe(labResult.id);
    expect(payload.orderId).toBe(order.id);

    // 8. Try to release it again -> 409 Conflict
    await request(app.getHttpServer())
      .post(`/api/v1/lab/results/${labResult.id}/release`)
      .expect(409);
  });

  afterAll(async () => {
    await app.close();
  });
});
