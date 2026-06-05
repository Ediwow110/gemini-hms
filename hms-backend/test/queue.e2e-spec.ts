import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, APP_GUARD } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { QueueModule } from '../src/queue/queue.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { AuditModule } from '../src/audit/audit.module';
import { cleanupDatabase } from './helpers/db-cleanup';
import { randomUUID } from 'crypto';

describe('Queue Branch Scoping (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        AuditModule,
        QueueModule,
      ],
      providers: [],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalGuards(new MockJwtAuthGuard());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupDatabase(prisma);

    const tenant = await prisma.tenant.create({
      data: { name: `Queue-Tenant-${randomUUID()}` },
    });
    const branch = await prisma.branch.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
        name: 'Queue Branch',
        code: `QB-${randomUUID().substring(0, 4)}`,
      },
    });

    MockJwtAuthGuard.user.tenantId = tenant.id;
    MockJwtAuthGuard.user.branchId = branch.id;
  });

  beforeEach(() => {
    MockJwtAuthGuard.user = {
      userId: randomUUID(),
      tenantId: MockJwtAuthGuard.user.tenantId,
      branchId: MockJwtAuthGuard.user.branchId,
      roles: ['Cashier'],
      permissions: ['*'],
      email: 'staff@hms.local',
    };
  });

  describe('POST /api/v1/queue/join', () => {
    it('should fail with 403 when DTO.branchId mismatches JWT branchId', async () => {
      return request(app.getHttpServer())
        .post('/api/v1/queue/join')
        .send({
          serviceType: 'RECEPTION',
          branchId: randomUUID(), // Mismatch
        })
        .expect(403);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
