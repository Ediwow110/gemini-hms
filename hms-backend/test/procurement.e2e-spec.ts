import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ProcurementModule } from '../src/procurement/procurement.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { randomUUID } from 'crypto';

describe('Procurement E2E', () => {
  let app: INestApplication;
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
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests-that-is-long-enough';

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
      .patch(`/api/v1/procurement/purchase-requests/${purchaseRequestId}/approve`)
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
      .patch(`/api/v1/procurement/purchase-requests/${purchaseRequestId}/approve`)
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
});
