import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { PERMISSIONS_KEY } from '../src/auth/decorators/permissions.decorator';
import { LogisticsModule } from '../src/logistics/logistics.module';
import { AuditModule } from '../src/audit/audit.module';
import { randomUUID } from 'crypto';

describe('Logistics & Field Service (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const tenantId = randomUUID();
  const techA_Id = randomUUID();
  const techB_Id = randomUUID();

  let branchId: string;
  let assetId: string;
  let installationJobId: string;
  let shipmentId: string;
  let deliveryJobId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        AuditModule,
        LogisticsModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useFactory({
        factory: (reflector: Reflector) => ({
          canActivate: (context: import('@nestjs/common').ExecutionContext) => {
            const raw = reflector.getAllAndOverride<
              string[] | { permissions: string[] }
            >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
            if (!raw) return true;
            const required = Array.isArray(raw) ? raw : raw.permissions;
            if (!required || required.length === 0) return true;
            const req = context.switchToHttp().getRequest();
            const user = req.user;
            if (!user || !user.permissions) return false;
            if (user.permissions.includes('*')) return true;
            return required.some((p: string) => user.permissions.includes(p));
          },
        }),
        inject: [Reflector],
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Setup basic data
    await prisma.tenant.create({
      data: { id: tenantId, name: 'Logistics Test Tenant', status: 'ACTIVE' },
    });

    await prisma.user.createMany({
      data: [
        {
          id: techA_Id,
          tenantId,
          email: 'techA@test.com',
          passwordHash: 'fake',
        },
        {
          id: techB_Id,
          tenantId,
          email: 'techB@test.com',
          passwordHash: 'fake',
        },
      ],
    });

    // Create a SalesOrder and Asset to link jobs to
    branchId = randomUUID();
    await prisma.branch.create({
      data: { id: branchId, tenantId, name: 'Main Branch', code: 'MAIN' },
    });

    const rfqId = randomUUID();
    await prisma.rFQ.create({
      data: {
        id: rfqId,
        tenantId,
        branchId,
        itemId: randomUUID(),
        buyerId: techA_Id,
        title: 'Test RFQ',
      },
    });

    const quoteId = randomUUID();
    await prisma.quote.create({
      data: {
        id: quoteId,
        tenantId,
        rfqId,
        amount: 1000,
        totalAmount: 1000,
        status: 'ACCEPTED',
      },
    });

    const orderId = randomUUID();
    await prisma.salesOrder.create({
      data: { id: orderId, tenantId, quoteId, status: 'CONFIRMED' },
    });

    assetId = randomUUID();
    await prisma.asset.create({
      data: {
        id: assetId,
        tenantId,
        salesOrderId: orderId,
        serialNumber: `SN-${randomUUID()}`,
        model: 'MRI-X1',
      },
    });

    // Create an Installation Job for Tech A
    installationJobId = randomUUID();
    await prisma.installationJob.create({
      data: {
        id: installationJobId,
        tenantId,
        assetId,
        assignedUserId: techA_Id,
        status: 'ASSIGNED',
      },
    });

    // Create a Shipment and Delivery Job for Tech A
    shipmentId = randomUUID();
    await prisma.shipment.create({
      data: {
        id: shipmentId,
        tenantId,
        salesOrderId: orderId,
        status: 'PENDING',
        trackingNumber: `TRK-${randomUUID()}`,
      },
    });

    deliveryJobId = randomUUID();
    await prisma.deliveryJob.create({
      data: {
        id: deliveryJobId,
        tenantId,
        shipmentId,
        assignedUserId: techA_Id,
        status: 'ASSIGNED',
      },
    });
  });

  it('Technician A should see their assigned jobs', async () => {
    MockJwtAuthGuard.user = {
      userId: techA_Id,
      tenantId,
      roles: ['Field Technician'],
      permissions: ['field_service.job.view'],
      email: 'techA@test.com',
      branchId,
    } as any;

    const res = await request(app.getHttpServer())
      .get('/api/v1/logistics/technician/jobs')
      .expect(200);

    expect(res.body.deliveries).toHaveLength(1);
    expect(res.body.installations).toHaveLength(1);
    expect(res.body.deliveries[0].id).toBe(deliveryJobId);
    expect(res.body.installations[0].id).toBe(installationJobId);
  });

  it('Technician B should see NO jobs (none assigned)', async () => {
    MockJwtAuthGuard.user = {
      userId: techB_Id,
      tenantId,
      roles: ['Field Technician'],
      permissions: ['field_service.job.view'],
      email: 'techB@test.com',
      branchId,
    } as any;

    const res = await request(app.getHttpServer())
      .get('/api/v1/logistics/technician/jobs')
      .expect(200);

    expect(res.body.deliveries).toHaveLength(0);
    expect(res.body.installations).toHaveLength(0);
  });

  it('Technician A should be able to start an installation job', async () => {
    MockJwtAuthGuard.user = {
      userId: techA_Id,
      tenantId,
      roles: ['Field Technician'],
      permissions: ['field_service.installation.update'],
      email: 'techA@test.com',
      branchId,
    } as any;

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/logistics/installations/${installationJobId}/status`)
      .send({ status: 'IN_PROGRESS', note: 'Starting now' })
      .expect(200);

    expect(res.body.status).toBe('IN_PROGRESS');

    // Verify asset status was also updated
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    expect(asset?.installationStatus).toBe('ASSEMBLING');
  });

  it('Cross-tenant isolation: Tech A cannot see jobs from another tenant', async () => {
    const otherTenantId = randomUUID();
    MockJwtAuthGuard.user = {
      userId: techA_Id,
      tenantId: otherTenantId,
      roles: ['Field Technician'],
      permissions: ['field_service.job.view'],
      email: 'techA@test.com',
      branchId,
    } as any;

    const res = await request(app.getHttpServer())
      .get('/api/v1/logistics/technician/jobs')
      .expect(200);

    expect(res.body.deliveries).toHaveLength(0);
    expect(res.body.installations).toHaveLength(0);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
