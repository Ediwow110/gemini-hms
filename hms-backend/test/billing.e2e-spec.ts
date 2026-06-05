import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, APP_GUARD } from '@nestjs/common';
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
import { cleanupDatabase } from './helpers/db-cleanup';

describe('Billing Branch Scoping (e2e)', () => {
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
    await cleanupDatabase(prisma);

    const tenant = await prisma.tenant.create({
      data: { name: `Billing-Tenant-${randomUUID()}` },
    });
    tenantId = tenant.id;

    const branch = await prisma.branch.create({
      data: {
        id: randomUUID(),
        tenantId,
        name: 'Test Branch',
        code: `B-${randomUUID().substring(0, 4)}`,
      },
    });
    branchId = branch.id;

    MockJwtAuthGuard.user.tenantId = tenantId;
    MockJwtAuthGuard.user.branchId = branchId;
    MockJwtAuthGuard.user.userId = '11111111-1111-4111-8111-111111111111';

    await seedUser(prisma, tenantId, 'billing-test@hms.local');
  });

  describe('POST /api/v1/billing/sessions/open', () => {
    it('should pass with unique branch and tenant', async () => {
      return request(app.getHttpServer())
        .post('/api/v1/billing/sessions/open')
        .send({
          branchId: branchId,
          openingBalance: 1000,
        })
        .expect(201);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
