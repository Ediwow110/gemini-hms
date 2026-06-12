import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { seedUser } from './helpers/seed.helper';
import { ApprovalsModule } from '../src/approvals/approvals.module';
import { AuditModule } from '../src/audit/audit.module';
import { cleanupDatabase } from './helpers/db-cleanup';
import { randomUUID } from 'crypto';

describe('Maker-Checker Security (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tenantId: string;
  let userId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        AuditModule,
        ApprovalsModule,
      ],
      providers: [],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BranchGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalGuards(new MockJwtAuthGuard());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupDatabase(prisma);

    const tenant = await prisma.tenant.create({
      data: { name: `Maker-Tenant-${randomUUID()}` },
    });
    tenantId = tenant.id;
    userId = '11111111-1111-4111-8111-111111111111';
    await seedUser(prisma, tenantId, 'maker@hms.local');

    MockJwtAuthGuard.user.tenantId = tenantId;
    MockJwtAuthGuard.user.userId = userId;
  });

  it('Creator should not be able to approve own request', async () => {
    const approvalId = randomUUID();

    // Seed ApprovalRequest created by the test user
    await prisma.approvalRequest.create({
      data: {
        id: approvalId,
        tenantId: tenantId,
        requesterId: userId,
        type: 'VOID_INVOICE',
        status: 'PENDING',
        riskLevel: 'LOW',
        recordId: '123',
        details: { invoiceId: '123' },
      },
    });

    return request(app.getHttpServer())
      .patch(`/api/v1/approvals/${approvalId}/approve`)
      .send({ reason: 'Self approving' })
      .expect(403);
  });

  afterAll(async () => {
    await app.close();
  });
});
