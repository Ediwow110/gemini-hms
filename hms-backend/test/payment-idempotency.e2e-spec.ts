import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
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

describe('Payment Idempotency (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let tenantId: string;
  let branchId: string;

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
      data: { name: `Idem-Tenant-${randomUUID()}` },
    });
    tenantId = tenant.id;

    const branch = await prisma.branch.create({
      data: {
        id: randomUUID(),
        tenantId,
        name: 'Idem Branch',
        code: `I-${randomUUID().substring(0, 4)}`,
      },
    });
    branchId = branch.id;

    MockJwtAuthGuard.user.tenantId = tenantId;
    MockJwtAuthGuard.user.branchId = branchId;
    MockJwtAuthGuard.user.userId = '11111111-1111-4111-8111-111111111111';

    await seedUser(prisma, tenantId, 'idempotency@hms.local');
  });

  it('should prevent duplicate payments using the same idempotency key', async () => {
    // 1. Open Session
    const openRes = await request(app.getHttpServer())
      .post('/api/v1/billing/sessions/open')
      .send({
        branchId,
        openingBalance: 1000,
      });

    const sessionId = openRes.body.id;

    // 2. Create Order & Invoice
    const patientId = randomUUID();
    await prisma.patient.create({
      data: {
        id: patientId,
        tenantId,
        patientNumber: `PT-IDEM-${randomUUID()}`,
        firstName: 'Jane',
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
        orderNumber: `ORD-IDEM-${randomUUID()}`,
        status: 'PENDING_PAYMENT',
      },
    });

    const invoiceId = randomUUID();
    await prisma.invoice.create({
      data: {
        id: invoiceId,
        tenantId,
        orderId,
        invoiceNumber: `INV-IDEM-${randomUUID()}`,
        totalAmount: 1000,
        paidAmount: 0,
        status: 'UNPAID',
      },
    });

    const idempotencyKey = randomUUID();
    const payload = {
      invoiceId,
      cashierSessionId: sessionId,
      amount: 1000,
      paymentMethod: 'CASH',
    };

    // 3. Post Payment 1 (Success)
    const res1 = await request(app.getHttpServer())
      .post('/api/v1/billing/payments')
      .set('idempotency-key', idempotencyKey)
      .send(payload)
      .expect(201);

    // 4. Post Payment 2 (Same Payload, Same Key) -> should return cached response
    const res2 = await request(app.getHttpServer())
      .post('/api/v1/billing/payments')
      .set('idempotency-key', idempotencyKey)
      .send(payload)
      .expect(201);

    expect(res1.body.payment.id).toBe(res2.body.payment.id);
    expect(res2.body._replayed).toBe(true);

    // 5. Post Payment 3 (Different Payload, Same Key) -> should return 409 Conflict
    await request(app.getHttpServer())
      .post('/api/v1/billing/payments')
      .set('idempotency-key', idempotencyKey)
      .send({ ...payload, amount: 500 })
      .expect(409);
  });

  afterAll(async () => {
    await app.close();
  });
});
