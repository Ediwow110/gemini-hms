import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { InsuranceModule } from '../src/insurance/insurance.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { randomUUID } from 'crypto';

describe('Insurance Claims E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantId: string;
  let branchId: string;
  let patientId: string;
  let invoiceId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        InsuranceModule,
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

    // Seed tenant & branch
    const tenant = await prisma.tenant.create({
      data: { name: `Insurance-Tenant-${randomUUID()}` },
    });
    tenantId = tenant.id;

    const branch = await prisma.branch.create({
      data: {
        tenantId,
        name: 'Insurance Branch',
        code: `INS-${randomUUID().substring(0, 4)}`,
      },
    });
    branchId = branch.id;

    // Seed patient
    const patient = await prisma.patient.create({
      data: {
        tenantId,
        patientNumber: `PT-INS-${randomUUID()}`,
        firstName: 'Jane',
        lastName: 'Doe',
        dob: new Date('1995-05-15'),
      },
    });
    patientId = patient.id;

    // Seed order & invoice
    const orderId = randomUUID();
    await prisma.order.create({
      data: {
        id: orderId,
        tenantId,
        branchId,
        patientId,
        orderNumber: `ORD-INS-${randomUUID()}`,
        status: 'PENDING_PAYMENT',
      },
    });

    const inv = await prisma.invoice.create({
      data: {
        id: randomUUID(),
        tenantId,
        orderId,
        invoiceNumber: `INV-INS-${randomUUID()}`,
        totalAmount: 1500.0,
        paidAmount: 0.0,
        status: 'UNPAID',
      },
    });
    invoiceId = inv.id;
  });

  beforeEach(() => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId: tenantId,
      branchId: branchId,
      roles: ['Super Admin'],
      permissions: ['*'],
      email: 'admin@hms.local',
    };
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should restrict claims operations based on roles', async () => {
    // 1. Nurse attempts to create claim -> 403
    MockJwtAuthGuard.user = {
      userId: randomUUID(),
      tenantId,
      branchId,
      roles: ['Nurse'],
      permissions: ['*'],
      email: 'nurse@hms.local',
    };

    await request(app.getHttpServer())
      .post('/insurance/claims')
      .send({
        invoiceId,
        providerCode: 'PHILHEALTH',
        claimedAmount: 1000.0,
      })
      .expect(403);
  });

  it('should allow Cashier/Super Admin to create, submit, and settle claims', async () => {
    // 2. Cashier creates claim for invoice -> 201
    MockJwtAuthGuard.user = {
      userId: randomUUID(),
      tenantId,
      branchId,
      roles: ['Cashier'],
      permissions: ['*'],
      email: 'finance@hms.local',
    };

    const createRes = await request(app.getHttpServer())
      .post('/insurance/claims')
      .send({
        invoiceId,
        providerCode: 'PHILHEALTH',
        claimedAmount: 1000.0,
      })
      .expect(201);

    const claimId = createRes.body.id;
    expect(claimId).toBeDefined();
    expect(createRes.body.status).toBe('DRAFT');
    expect(createRes.body.claimedAmount).toBe('1000');

    // 3. Duplicate active claim check -> 409
    await request(app.getHttpServer())
      .post('/insurance/claims')
      .send({
        invoiceId,
        providerCode: 'PHILHEALTH',
        claimedAmount: 1000.0,
      })
      .expect(409);

    // 4. Cashier submits claim -> status becomes SUBMITTED, claimNumber set
    const submitRes = await request(app.getHttpServer())
      .post(`/insurance/claims/${claimId}/submit`)
      .expect(201);

    expect(submitRes.body.status).toBe('SUBMITTED');
    expect(submitRes.body.claimNumber).toBeDefined();
    expect(submitRes.body.submittedAt).toBeDefined();

    // 5. Super Admin updates claim to PAID -> settledAmount set, ledger entry posted
    MockJwtAuthGuard.user = {
      userId: randomUUID(),
      tenantId,
      branchId,
      roles: ['Super Admin'],
      permissions: ['*'],
      email: 'admin@hms.local',
    };

    const settleRes = await request(app.getHttpServer())
      .patch(`/insurance/claims/${claimId}/status`)
      .send({
        status: 'PAID',
        settledAmount: 950.0,
      })
      .expect(200);

    expect(settleRes.body.status).toBe('PAID');
    expect(settleRes.body.settledAmount).toBe('950');
    expect(settleRes.body.settledAt).toBeDefined();

    // Verify double-entry ledger entry was posted
    const ledgerEntriesRes = await request(app.getHttpServer())
      .get(
        `/ledger/entries?referenceType=CLAIM_SETTLEMENT&referenceId=${claimId}`,
      )
      .expect(200);

    expect(ledgerEntriesRes.body.length).toBe(1);
    expect(ledgerEntriesRes.body[0].debitAccount).toBe('INSURANCE_RECEIVABLE');
    expect(ledgerEntriesRes.body[0].creditAccount).toBe('REVENUE');
    expect(ledgerEntriesRes.body[0].amount).toBe('950');
  });
});
