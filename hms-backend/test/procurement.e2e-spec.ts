import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ProcurementModule } from '../src/procurement/procurement.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { randomUUID } from 'crypto';

describe('Procurement E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tenantId: string;
  let branchId: string;

  async function createTestUser(): Promise<string> {
    const user = await prisma.user.create({
      data: {
        tenantId,
        email: `actor-${randomUUID()}@hms.local`,
        passwordHash: 'dummy',
        status: 'ACTIVE',
      },
    });
    return user.id;
  }

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        ProcurementModule,
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
      data: { name: `Procurement-Tenant-${randomUUID()}` },
    });
    tenantId = tenant.id;

    const branch = await prisma.branch.create({
      data: {
        tenantId,
        name: 'Procurement Branch',
        code: `PRB-${randomUUID().substring(0, 4)}`,
      },
    });
    branchId = branch.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  // Shared helpers for concurrency tests
  async function createApprovedPR(
    staffId: string,
    managerId: string,
  ): Promise<{ purchaseRequestId: string; supplierId: string }> {
    // Create supplier
    const supplierRes = await request(app.getHttpServer())
      .post('/api/v1/procurement/suppliers')
      .send({
        name: `Concurrency Supplier ${randomUUID()}`,
        contactName: 'Test',
        contactEmail: `supplier-${randomUUID()}@test.local`,
      })
      .expect(201);
    const supplierId = supplierRes.body.id;

    // Inventory staff creates PR
    MockJwtAuthGuard.user = {
      userId: staffId,
      tenantId,
      branchId,
      roles: ['Inventory Staff'],
      permissions: ['*'],
      email: `staff-${randomUUID()}@hms.local`,
    };
    const prRes = await request(app.getHttpServer())
      .post('/api/v1/procurement/purchase-requests')
      .send({
        branchId,
        items: [{ sku: 'MED-TEST', quantity: 10, unitPrice: 5.0 }],
        reason: 'Concurrency test',
      })
      .expect(201);
    const purchaseRequestId = prRes.body.id;

    // Manager approves
    MockJwtAuthGuard.user = {
      userId: managerId,
      tenantId,
      branchId,
      roles: ['Branch Manager'],
      permissions: ['*'],
      email: `manager-${randomUUID()}@hms.local`,
    };
    await request(app.getHttpServer())
      .patch(
        `/api/v1/procurement/purchase-requests/${purchaseRequestId}/approve`,
      )
      .expect(200);

    return { purchaseRequestId, supplierId };
  }

  it('should implement the purchase request and PO lifecycle with role gating', async () => {
    const staffId = await createTestUser();
    const managerId = await createTestUser();

    // 1. Seed a supplier
    MockJwtAuthGuard.user = {
      userId: managerId,
      tenantId,
      branchId,
      roles: ['Branch Manager'],
      permissions: ['*'],
      email: 'manager@hms.local',
    };

    const supplierRes = await request(app.getHttpServer())
      .post('/api/v1/procurement/suppliers')
      .send({
        name: 'National Pharma Inc.',
        contactName: 'Jane Smith',
        contactEmail: 'jane@pharma.local',
        contactPhone: '555-1234',
        address: 'Manila, Philippines',
      })
      .expect(201);

    const supplierId = supplierRes.body.id;
    expect(supplierId).toBeDefined();

    // 2. Inventory staff creates purchase request -> 201
    MockJwtAuthGuard.user = {
      userId: staffId,
      tenantId,
      branchId,
      roles: ['Inventory Staff'],
      permissions: ['*'],
      email: 'staff@hms.local',
    };

    const requestRes = await request(app.getHttpServer())
      .post('/api/v1/procurement/purchase-requests')
      .send({
        branchId,
        items: [
          { sku: 'MED-PARA-500', quantity: 100, unitPrice: 1.5 },
          { sku: 'MED-AMOX-500', quantity: 50, unitPrice: 3.0 },
        ],
        reason: 'Restocking primary pharmacy',
      })
      .expect(201);

    const purchaseRequestId = requestRes.body.id;
    expect(purchaseRequestId).toBeDefined();
    expect(requestRes.body.status).toBe('SUBMITTED');

    // 3. Self-approval guard: Inventory staff attempts to approve own PR -> 403
    await request(app.getHttpServer())
      .patch(
        `/api/v1/procurement/purchase-requests/${purchaseRequestId}/approve`,
      )
      .expect(403);

    // 4. Branch Manager approves purchase request -> status APPROVED -> 200
    MockJwtAuthGuard.user = {
      userId: managerId,
      tenantId,
      branchId,
      roles: ['Branch Manager'],
      permissions: ['*'],
      email: 'manager@hms.local',
    };

    const approveRes = await request(app.getHttpServer())
      .patch(
        `/api/v1/procurement/purchase-requests/${purchaseRequestId}/approve`,
      )
      .expect(200);

    expect(approveRes.body.status).toBe('APPROVED');
    expect(approveRes.body.approvedById).toBe(managerId);

    // 5. Create PO against approved PR -> 201
    const poRes = await request(app.getHttpServer())
      .post('/api/v1/procurement/purchase-orders')
      .send({
        branchId,
        supplierId,
        purchaseRequestId,
      })
      .expect(201);

    const purchaseOrderId = poRes.body.id;
    expect(purchaseOrderId).toBeDefined();
    expect(poRes.body.orderNumber).toBeDefined();
    expect(poRes.body.status).toBe('SENT');

    // 6. Post receiving record -> PO status becomes RECEIVED -> 201
    MockJwtAuthGuard.user = {
      userId: staffId,
      tenantId,
      branchId,
      roles: ['Inventory Staff'],
      permissions: ['*'],
      email: 'staff@hms.local',
    };

    const receiveRes = await request(app.getHttpServer())
      .post(`/api/v1/procurement/purchase-orders/${purchaseOrderId}/receive`)
      .send({
        notes: 'All items delivered intact.',
      })
      .expect(201);

    expect(receiveRes.body.id).toBeDefined();
    expect(receiveRes.body.purchaseOrderId).toBe(purchaseOrderId);
    expect(receiveRes.body.receivedById).toBe(staffId);

    // Verify PO status was updated to RECEIVED
    const checkPr = await prisma.purchaseRequest.findUnique({
      where: { id: purchaseRequestId },
    });
    expect(checkPr?.status).toBe('ORDERED');
  });

  it('should prevent duplicate POs against the same PR (concurrency race)', async () => {
    const staffId = await createTestUser();
    const managerId = await createTestUser();
    const { purchaseRequestId, supplierId } = await createApprovedPR(
      staffId,
      managerId,
    );

    // Send two concurrent createPurchaseOrder requests
    MockJwtAuthGuard.user = {
      userId: managerId,
      tenantId,
      branchId,
      roles: ['Branch Manager'],
      permissions: ['*'],
      email: `manager-${randomUUID()}@hms.local`,
    };

    const results = await Promise.allSettled([
      request(app.getHttpServer())
        .post('/api/v1/procurement/purchase-orders')
        .send({ branchId, supplierId, purchaseRequestId }),
      request(app.getHttpServer())
        .post('/api/v1/procurement/purchase-orders')
        .send({ branchId, supplierId, purchaseRequestId }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // Verify only one PO exists in DB
    const pos = await prisma.purchaseOrder.findMany({
      where: { purchaseRequestId },
    });
    expect(pos.length).toBe(1);
    expect(pos[0].status).toBe('SENT');

    // Verify PR status is ORDERED
    const pr = await prisma.purchaseRequest.findUnique({
      where: { id: purchaseRequestId },
    });
    expect(pr?.status).toBe('ORDERED');
  });

  it('should prevent duplicate receiving records against the same PO (concurrency race)', async () => {
    const staffId = await createTestUser();
    const managerId = await createTestUser();
    const { purchaseRequestId, supplierId } = await createApprovedPR(
      staffId,
      managerId,
    );

    // Create one PO
    MockJwtAuthGuard.user = {
      userId: managerId,
      tenantId,
      branchId,
      roles: ['Branch Manager'],
      permissions: ['*'],
      email: `manager-${randomUUID()}@hms.local`,
    };
    const poRes = await request(app.getHttpServer())
      .post('/api/v1/procurement/purchase-orders')
      .send({ branchId, supplierId, purchaseRequestId })
      .expect(201);
    const purchaseOrderId = poRes.body.id;

    // Send two concurrent receive requests
    MockJwtAuthGuard.user = {
      userId: staffId,
      tenantId,
      branchId,
      roles: ['Inventory Staff'],
      permissions: ['*'],
      email: `staff-${randomUUID()}@hms.local`,
    };

    const results = await Promise.allSettled([
      request(app.getHttpServer())
        .post(`/api/v1/procurement/purchase-orders/${purchaseOrderId}/receive`)
        .send({ notes: 'Concurrent receive test' }),
      request(app.getHttpServer())
        .post(`/api/v1/procurement/purchase-orders/${purchaseOrderId}/receive`)
        .send({ notes: 'Concurrent receive test' }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // Verify only one receiving record exists in DB
    const records = await prisma.receivingRecord.findMany({
      where: { purchaseOrderId },
    });
    expect(records.length).toBe(1);

    // Verify PO status is RECEIVED
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
    });
    expect(po?.status).toBe('RECEIVED');
  });

  it('should reject PO creation if PR is not APPROVED', async () => {
    const staffId = await createTestUser();
    const managerId = await createTestUser();

    // Create PR without approving it
    MockJwtAuthGuard.user = {
      userId: staffId,
      tenantId,
      branchId,
      roles: ['Inventory Staff'],
      permissions: ['*'],
      email: `staff-${randomUUID()}@hms.local`,
    };
    const prRes = await request(app.getHttpServer())
      .post('/api/v1/procurement/purchase-requests')
      .send({
        branchId,
        items: [{ sku: 'MED-GUARD', quantity: 1, unitPrice: 10 }],
        reason: 'State guard test',
      })
      .expect(201);
    const purchaseRequestId = prRes.body.id;

    // Create a supplier
    const supplierRes = await request(app.getHttpServer())
      .post('/api/v1/procurement/suppliers')
      .send({
        name: `Guard Supplier ${randomUUID()}`,
        contactEmail: `guard-${randomUUID()}@test.local`,
      })
      .expect(201);
    const supplierId = supplierRes.body.id;

    // Attempt to create PO against non-APPROVED PR -> should fail
    MockJwtAuthGuard.user = {
      userId: managerId,
      tenantId,
      branchId,
      roles: ['Branch Manager'],
      permissions: ['*'],
      email: `manager-${randomUUID()}@hms.local`,
    };
    await request(app.getHttpServer())
      .post('/api/v1/procurement/purchase-orders')
      .send({ branchId, supplierId, purchaseRequestId })
      .expect(400);
  });

  it('should reject duplicate receive and reject receive on non-SENT PO', async () => {
    const staffId = await createTestUser();
    const managerId = await createTestUser();
    const { purchaseRequestId, supplierId } = await createApprovedPR(
      staffId,
      managerId,
    );

    // Create PO
    MockJwtAuthGuard.user = {
      userId: managerId,
      tenantId,
      branchId,
      roles: ['Branch Manager'],
      permissions: ['*'],
      email: `manager-${randomUUID()}@hms.local`,
    };
    const poRes = await request(app.getHttpServer())
      .post('/api/v1/procurement/purchase-orders')
      .send({ branchId, supplierId, purchaseRequestId })
      .expect(201);
    const purchaseOrderId = poRes.body.id;

    // First receive succeeds
    MockJwtAuthGuard.user = {
      userId: staffId,
      tenantId,
      branchId,
      roles: ['Inventory Staff'],
      permissions: ['*'],
      email: `staff-${randomUUID()}@hms.local`,
    };
    await request(app.getHttpServer())
      .post(`/api/v1/procurement/purchase-orders/${purchaseOrderId}/receive`)
      .send({ notes: 'First receive' })
      .expect(201);

    // Second receive (same PO, already RECEIVED) -> fails
    await request(app.getHttpServer())
      .post(`/api/v1/procurement/purchase-orders/${purchaseOrderId}/receive`)
      .send({ notes: 'Duplicate receive' })
      .expect(400);
  });
});
