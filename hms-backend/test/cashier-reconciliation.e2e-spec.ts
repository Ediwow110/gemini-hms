import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, APP_GUARD } from '@nestjs/common';
import request from 'supertest';
import { BillingModule } from '../src/billing/billing.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { NumberingModule } from '../src/numbering/numbering.module';
import { AuditModule } from '../src/audit/audit.module';
import { ApprovalsModule } from '../src/approvals/approvals.module';
import { seedUser } from './helpers/seed.helper';
import { randomUUID } from 'crypto';

describe('Cashier Reconciliation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let tenantId: string;
  let branchId: string;
  let userId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        NumberingModule,
        AuditModule,
        ApprovalsModule,
        BillingModule,
      ],
      providers: [],
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

    const tenant = await prisma.tenant.create({
      data: { name: `Recon-Tenant-${randomUUID()}` },
    });
    tenantId = tenant.id;

    const branch = await prisma.branch.create({
      data: {
        id: randomUUID(),
        tenantId,
        name: 'Recon Branch',
        code: `R-${randomUUID().substring(0, 4)}`,
      },
    });
    branchId = branch.id;
    userId = '11111111-1111-4111-8111-111111111111';

    MockJwtAuthGuard.user.tenantId = tenantId;
    MockJwtAuthGuard.user.branchId = branchId;
    MockJwtAuthGuard.user.userId = userId;

    await seedUser(prisma, tenantId, 'recon@hms.local');
  });

  beforeEach(() => {
    MockJwtAuthGuard.user = {
      userId: userId,
      tenantId: tenantId,
      branchId: branchId,
      roles: ['Super Admin'],
      permissions: ['*'],
      email: 'recon@hms.local',
    };
  });

  it('should reconcile cashier session totals', async () => {
    // 1. Open Session
    const openRes = await request(app.getHttpServer())
      .post('/api/v1/billing/sessions/open')
      .send({
        branchId,
        openingBalance: 1000,
      })
      .expect(201);

    const sessionId = openRes.body.id;

    // 2. Create Patient and Order
    const patientId = randomUUID();
    await prisma.patient.create({
      data: {
        id: patientId,
        tenantId,
        patientNumber: `PT-RECON-${randomUUID()}`,
        firstName: 'John',
        lastName: 'Doe',
        dob: new Date(),
      },
    });

    const orderId = randomUUID();
    await prisma.order.create({
      data: {
        id: orderId,
        tenantId,
        branchId,
        patientId,
        orderNumber: `ORD-RECON-${randomUUID()}`,
        status: 'PENDING_PAYMENT',
      },
    });

    const invoiceId = randomUUID();
    await prisma.invoice.create({
      data: {
        id: invoiceId,
        tenantId,
        orderId,
        invoiceNumber: `INV-RECON-${randomUUID()}`,
        totalAmount: 500,
        paidAmount: 0,
        status: 'UNPAID',
      },
    });

    // 3. Post Payment
    await request(app.getHttpServer())
      .post('/api/v1/billing/payments')
      .set('idempotency-key', randomUUID())
      .send({
        invoiceId,
        cashierSessionId: sessionId,
        amount: 500,
        paymentMethod: 'CASH',
      })
      .expect(201);

    // 4. Close Session
    const closeRes = await request(app.getHttpServer())
      .patch(`/api/v1/billing/sessions/${sessionId}/close`)
      .send({
        actualClosingBalance: 1500,
      })
      .expect(200);

    expect(Number(closeRes.body.expectedCash)).toBe(1500);
  });

  afterAll(async () => {
    await app.close();
  });
});
