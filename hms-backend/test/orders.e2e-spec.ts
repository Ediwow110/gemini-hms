import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { OrdersModule } from '../src/orders/orders.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { NumberingModule } from '../src/numbering/numbering.module';
import { AuditModule } from '../src/audit/audit.module';
import { cleanupDatabase } from './helpers/db-cleanup';
import { randomUUID } from 'crypto';

describe('Orders Branch Scoping (e2e)', () => {
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
        OrdersModule,
      ],
      providers: [],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalGuards(new MockJwtAuthGuard());
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupDatabase(prisma);

    const tenant = await prisma.tenant.create({
      data: { name: `Orders-Tenant-${randomUUID()}` },
    },
  }, 30000););
    tenantId = tenant.id;
    const branch = await prisma.branch.create({
      data: {
        id: randomUUID(),
        tenantId,
        name: 'Orders Branch',
        code: `OB-${randomUUID().substring(0, 4)}`,
      },
    });
    branchId = branch.id;

    MockJwtAuthGuard.user.tenantId = tenantId;
    MockJwtAuthGuard.user.branchId = branchId;
  });

  beforeEach(() => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId: tenantId,
      branchId: branchId,
      roles: ['Cashier'],
      permissions: ['*'],
      email: 'staff@hms.local',
    };
  });

  describe('POST /api/v1/orders', () => {
    it('should fail with 403 when DTO.branchId mismatches JWT branchId', async () => {
      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({
          patientId: randomUUID(),
          branchId: randomUUID(), // Mismatch
          items: [
            {
              itemType: 'SERVICE',
              itemId: randomUUID(),
              quantity: 1,
            },
          ],
        })
        .expect(403);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
