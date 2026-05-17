import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, APP_GUARD } from '@nestjs/common';
import request from 'supertest';
import { BillingModule } from '../src/billing/billing.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { MockPermissionsGuard } from './helpers/mock-permissions.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { NumberingModule } from '../src/numbering/numbering.module';
import { AuditModule } from '../src/audit/audit.module';
import { ApprovalsModule } from '../src/approvals/approvals.module';
import { seedUser } from './helpers/seed.helper';
import { randomUUID } from 'crypto';

describe('Refund Permissions & Approval (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  let tenantId: string;
  let branchId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests-that-is-long-enough';
    
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
    .overrideGuard(PermissionsGuard).useClass(MockPermissionsGuard)
    .overrideGuard(BranchGuard).useValue({ canActivate: () => true })
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalGuards(new MockJwtAuthGuard());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    
    const tenant = await prisma.tenant.create({ data: { name: `Refund-Tenant-${randomUUID()}` } });
    tenantId = tenant.id;
    
    const branch = await prisma.branch.create({
      data: {
        id: randomUUID(),
        tenantId,
        name: 'Refund Branch',
        code: `RF-${randomUUID().substring(0, 4)}`,
      }
    });
    branchId = branch.id;

    MockJwtAuthGuard.user.tenantId = tenantId;
    MockJwtAuthGuard.user.branchId = branchId;
    MockJwtAuthGuard.user.userId = '11111111-1111-4111-8111-111111111111';

    await seedUser(prisma, tenantId, 'refund@hms.local');
  });

  describe('POST /api/v1/billing/refunds/request', () => {
    it('should fail (403) when user lacks billing.refund.request', async () => {
      MockJwtAuthGuard.user.permissions = [];
      
      return request(app.getHttpServer())
        .post('/api/v1/billing/refunds/request')
        .send({
          paymentId: randomUUID(),
          amount: 100,
          reason: 'Test',
        })
        .expect(403);
    });

    it('should succeed (201) when user has billing.refund.request', async () => {
      MockJwtAuthGuard.user.permissions = ['billing.refund.request'];
      
      const patientId = randomUUID();
      await prisma.patient.create({
        data: { id: patientId, tenantId, patientNumber: `PT-REF-${randomUUID()}`, firstName: 'A', lastName: 'B', dob: new Date() }
      });

      const orderId = randomUUID();
      await prisma.order.create({
        data: { id: orderId, tenantId, branchId, patientId, orderNumber: randomUUID() }
      });

      const invoiceId = randomUUID();
      await prisma.invoice.create({
        data: { id: invoiceId, tenantId, orderId, invoiceNumber: randomUUID(), totalAmount: 1000, paidAmount: 1000, status: 'PAID' }
      });

      const sessionId = randomUUID();
      await prisma.cashierSession.create({
        data: { id: sessionId, tenantId, branchId, userId: MockJwtAuthGuard.user.userId, openingBalance: 0, status: 'OPEN' }
      });

      const paymentId = randomUUID();
      await prisma.payment.create({
        data: {
          id: paymentId,
          tenantId,
          invoiceId,
          cashierSessionId: sessionId,
          amount: 1000,
          paymentMethod: 'CASH',
          status: 'POSTED',
          receiptNumber: `R-${randomUUID().substring(0, 8)}`,
          idempotencyKey: randomUUID(),
        }
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/refunds/request')
        .send({
          paymentId: paymentId,
          amount: 500,
          reason: 'Double charge',
        })
        .expect(201);

      expect(res.body.status).toBe('PENDING');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});

