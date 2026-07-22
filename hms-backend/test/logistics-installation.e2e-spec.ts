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
import { randomUUID } from 'crypto';

describe('Logistics & Installation E2E Gates (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const tenantId = '00000000-0000-0000-0000-00000000000c';
  let testBranchId: string;
  let testJobId: string;
  let testAssetId: string;
  let testUserId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        LogisticsModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useFactory({
        factory: (reflector: Reflector) => ({
          canActivate: (context: import('@nestjs/common').ExecutionContext) => {
            const metadata = reflector.getAllAndOverride<string[]>(
              PERMISSIONS_KEY,
              [context.getHandler(), context.getClass()],
            );
            if (!metadata || metadata.length === 0) return true;
            const req = context.switchToHttp().getRequest();
            const user = req.user;
            if (!user || !user.permissions) return false;
            if (user.permissions.includes('*')) return true;
            return metadata.some((p: string) => user.permissions.includes(p));
          },
        }),
        inject: [Reflector],
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Seed tenant and dependencies
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: {
        id: tenantId,
        name: 'logistics-e2e-tenant',
        status: 'ACTIVE',
      },
    });

    // Seed User for audit logs foreign key constraint
    const userEmail = `tech-${randomUUID()}@hospital.com`;
    const mockUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        tenantId,
        email: userEmail,
        passwordHash: 'mock-password-hash',
      },
    });
    testUserId = mockUser.id;

    const branch = await prisma.branch.create({
      data: {
        id: randomUUID(),
        tenantId,
        name: 'logistics-branch',
        code: 'LOG-E2E-' + randomUUID().substring(0, 4),
      },
    });
    testBranchId = branch.id;

    const rfq = await prisma.rFQ.create({
      data: {
        id: randomUUID(),
        tenantId,
        branchId: testBranchId,
        itemId: randomUUID(),
        buyerId: testUserId,
        title: 'High Resolution CT Unit',
        status: 'SUBMITTED',
      },
    });

    const quote = await prisma.quote.create({
      data: {
        id: randomUUID(),
        rfqId: rfq.id,
        tenantId,
        amount: 185000.0,
        totalAmount: 185000.0,
        status: 'ACCEPTED',
      },
    });

    const salesOrder = await prisma.salesOrder.create({
      data: {
        id: randomUUID(),
        quoteId: quote.id,
        tenantId,
        status: 'CONFIRMED',
      },
    });

    const asset = await prisma.asset.create({
      data: {
        id: randomUUID(),
        salesOrderId: salesOrder.id,
        tenantId,
        serialNumber: 'SN-E2E-' + randomUUID().substring(0, 8),
        model: 'Siemens Scanner G3',
        installationStatus: 'PENDING_ASSESSMENT',
      },
    });
    testAssetId = asset.id;

    const job = await prisma.installationJob.create({
      data: {
        id: randomUUID(),
        tenantId,
        assetId: asset.id,
        assignedUserId: testUserId,
        status: 'ASSIGNED',
      },
    });
    testJobId = job.id;
  });

  it('should block anonymous role from retrieving installations list', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId: tenantId,
      email: 'anonymous@hospital.com',
      roles: [], // empty roles block
      permissions: [],
      branchId: testBranchId,
    };

    await request(app.getHttpServer())
      .get('/api/v1/logistics/installations')
      .expect(403);
  });

  it('should allow authorized nurse role to query installations list', async () => {
    MockJwtAuthGuard.user = {
      userId: testUserId,
      tenantId: tenantId,
      email: 'tech@hospital.com',
      roles: ['Nurse'],
      permissions: ['field_service.job.view'],
      branchId: testBranchId,
    };

    await request(app.getHttpServer())
      .get('/api/v1/logistics/installations')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].asset).toBeDefined();
      });
  });

  it('should allow technician to get dynamic job details', async () => {
    MockJwtAuthGuard.user = {
      userId: testUserId,
      tenantId: tenantId,
      email: 'tech@hospital.com',
      roles: ['Nurse'],
      permissions: ['field_service.job.view'],
      branchId: testBranchId,
    };

    await request(app.getHttpServer())
      .get(`/api/v1/logistics/installations/${testJobId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(testJobId);
        expect(res.body.assetId).toBe(testAssetId);
        expect(res.body.status).toBe('ASSIGNED');
      });
  });

  it('should transactionally update status to IN_PROGRESS and set Asset to ASSEMBLING', async () => {
    MockJwtAuthGuard.user = {
      userId: testUserId,
      tenantId: tenantId,
      email: 'tech@hospital.com',
      roles: ['Nurse'],
      permissions: ['field_service.installation.update'],
      branchId: testBranchId,
    };

    await request(app.getHttpServer())
      .patch(`/api/v1/logistics/installations/${testJobId}/status`)
      .send({ status: 'IN_PROGRESS', note: 'Unpacking scanner assembly parts' })
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('IN_PROGRESS');
        expect(res.body.assetInstallStatus).toBe('ASSEMBLING');
      });
  });

  it('should execute final sign-off update status to COMPLETED and bind strict warranty start to handover timestamp', async () => {
    MockJwtAuthGuard.user = {
      userId: testUserId,
      tenantId: tenantId,
      email: 'tech@hospital.com',
      roles: ['Nurse'],
      permissions: ['field_service.installation.update'],
      branchId: testBranchId,
    };

    await request(app.getHttpServer())
      .patch(`/api/v1/logistics/installations/${testJobId}/status`)
      .send({
        status: 'COMPLETED',
        note: 'Customer accepted handover criteria',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('COMPLETED');
        expect(res.body.handoverSignedAt).toBeDefined();

        // Assert critical legal and operational boundary constraint:
        // Bind warranty start strictly to handover signed timestamp
        const handoverTime = new Date(res.body.handoverSignedAt).getTime();
        const warrantyStartTime = new Date(res.body.warrantyStart).getTime();
        const warrantyEndTime = new Date(res.body.warrantyEnd).getTime();

        expect(warrantyStartTime).toBe(handoverTime);

        // Assert exactly 1 year warranty duration
        const yearMs = 365 * 24 * 60 * 60 * 1000;
        expect(warrantyEndTime).toBe(handoverTime + yearMs);
      });

    // Cross-verify transactional persistency in DB
    const persistedAsset = await prisma.asset.findUnique({
      where: { id: testAssetId },
    });
    expect(persistedAsset?.installationStatus).toBe('HANDED_OVER');
    expect(persistedAsset?.warrantyStart).toBeDefined();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
