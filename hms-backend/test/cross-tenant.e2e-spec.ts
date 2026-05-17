import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, APP_GUARD } from '@nestjs/common';
import request from 'supertest';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { seedTenants, seedUser } from './helpers/seed.helper';
import { PatientsModule } from '../src/patients/patients.module';
import { OrdersModule } from '../src/orders/orders.module';
import { LabModule } from '../src/lab/lab.module';
import { NumberingModule } from '../src/numbering/numbering.module';
import { AuditModule } from '../src/audit/audit.module';
import { randomUUID } from 'crypto';

describe('Cross-Tenant Security (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  let tenantAId: string;
  let tenantBId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests-that-is-long-enough';
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        NumberingModule,
        AuditModule,
        PatientsModule,
        OrdersModule,
        LabModule,
      ],
      providers: [],
    })
    .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
    .overrideGuard(BranchGuard).useValue({ canActivate: () => true })
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalGuards(new MockJwtAuthGuard());
    await app.init();

    prisma = app.get(PrismaService);
    
    // Create unique tenants
    const tA = await prisma.tenant.create({ data: { name: `TenantA-${randomUUID()}` } });
    tenantAId = tA.id;
    const tB = await prisma.tenant.create({ data: { name: `TenantB-${randomUUID()}` } });
    tenantBId = tB.id;

    // Mock user is in Tenant A
    MockJwtAuthGuard.user.tenantId = tenantAId;
    MockJwtAuthGuard.user.userId = '11111111-1111-4111-8111-111111111111';

    // Seed Tenant B Patient
    const patientBId = randomUUID();
    await prisma.patient.create({
      data: {
        id: patientBId,
        tenantId: tenantBId,
        patientNumber: `PT-B-${randomUUID().substring(0, 8)}`,
        firstName: 'Tenant B',
        lastName: 'Patient',
        dob: new Date(),
      }
    });
    (global as any).patientBId = patientBId;

    // Seed Tenant B Order
    const branchBId = randomUUID();
    await prisma.branch.create({
      data: {
        id: branchBId,
        tenantId: tenantBId,
        name: 'Branch B',
        code: `B-B-${randomUUID().substring(0, 4)}`,
      }
    });

    const orderBId = randomUUID();
    await prisma.order.create({
      data: {
        id: orderBId,
        tenantId: tenantBId,
        branchId: branchBId,
        patientId: patientBId,
        orderNumber: `ORD-B-${randomUUID().substring(0, 8)}`,
      }
    });
    (global as any).orderBId = orderBId;

    // Seed Tenant B Lab Result
    const resultBId = randomUUID();
    await prisma.labResult.create({
      data: {
        id: resultBId,
        tenantId: tenantBId,
        orderId: orderBId,
        status: 'RELEASED',
      }
    });
    (global as any).resultBId = resultBId;
  });

  it('Tenant A should not read Tenant B Patient', async () => {
    return request(app.getHttpServer())
      .get(`/api/v1/patients/${(global as any).patientBId}`)
      .expect((res) => {
          if (res.status !== 403 && res.status !== 404) {
              throw new Error(`Expected 403 or 404, got ${res.status}`);
          }
      });
  });

  it('Tenant A should not read Tenant B Order', async () => {
    return request(app.getHttpServer())
      .get(`/api/v1/orders/${(global as any).orderBId}`)
      .expect((res) => {
          if (res.status !== 403 && res.status !== 404 && res.status !== 400) {
              throw new Error(`Expected 403, 404 or 400, got ${res.status}`);
          }
      });
  });

  it('Tenant A should not read Tenant B Lab Result', async () => {
    return request(app.getHttpServer())
      .get(`/api/v1/lab/results/${(global as any).resultBId}`)
      .expect((res) => {
          if (res.status !== 403 && res.status !== 404) {
              throw new Error(`Expected 403 or 404, got ${res.status}`);
          }
      });
  });

  afterAll(async () => {
    await app.close();
  });
});

