import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ReferralPartnersModule } from '../src/referral-partners/referral-partners.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { randomUUID } from 'crypto';

describe('Referral Partners E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantId: string;
  let branchId: string;
  let patientId: string;
  let orderId: string;

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
        ReferralPartnersModule,
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
      data: { name: `Referral-Tenant-${randomUUID()}` },
    });
    tenantId = tenant.id;

    const branch = await prisma.branch.create({
      data: {
        tenantId,
        name: 'Referral Test Branch',
        code: `RFB-${randomUUID().substring(0, 4)}`,
      },
    });
    branchId = branch.id;

    // Seed Patient
    const patient = await prisma.patient.create({
      data: {
        tenantId,
        patientNumber: `PT-REF-${randomUUID()}`,
        firstName: 'Marcus',
        lastName: 'Aurelius',
        dob: new Date('1990-01-01'),
      },
    });
    patientId = patient.id;

    // Seed Order
    const order = await prisma.order.create({
      data: {
        tenantId,
        branchId,
        patientId,
        orderNumber: `ORD-REF-${randomUUID()}`,
        status: 'PENDING_PAYMENT',
      },
    });
    orderId = order.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should restrict referrer creation based on roles', async () => {
    const doctorUserId = await createTestUser();
    MockJwtAuthGuard.user = {
      userId: doctorUserId,
      tenantId,
      branchId,
      roles: ['Doctor'],
      permissions: ['*'],
      email: 'doctor@hms.local',
    };

    await request(app.getHttpServer())
      .post('/api/v1/referrals/referrers')
      .send({
        name: 'Dr. Gregory House',
        type: 'DOCTOR',
        contactInfo: 'house@ppth.local',
        rebateRate: 0.15,
      })
      .expect(403);
  });

  it('should allow Admin to register referrer and create rebate records', async () => {
    const adminUserId = await createTestUser();
    MockJwtAuthGuard.user = {
      userId: adminUserId,
      tenantId,
      branchId,
      roles: ['Super Admin'],
      permissions: ['*'],
      email: 'admin@hms.local',
    };

    const referrerRes = await request(app.getHttpServer())
      .post('/api/v1/referrals/referrers')
      .send({
        name: 'Dr. Gregory House',
        type: 'DOCTOR',
        contactInfo: 'house@ppth.local',
        rebateRate: 0.15,
      })
      .expect(201);

    const referrerId = referrerRes.body.id;
    expect(referrerId).toBeDefined();
    expect(referrerRes.body.name).toBe('Dr. Gregory House');
    expect(referrerRes.body.rebateRate).toBe('0.15');

    // 3. Create referral record linked to patient + order -> 201
    const recordRes = await request(app.getHttpServer())
      .post('/api/v1/referrals/records')
      .send({
        patientId,
        orderId,
        referrerId,
        rebateAmount: 150.0,
      })
      .expect(201);

    const recordId = recordRes.body.id;
    expect(recordId).toBeDefined();
    expect(recordRes.body.status).toBe('PENDING');
    expect(recordRes.body.rebateAmount).toBe('150');

    // 4. Referral record status updated to CONFIRMED -> 200
    const updateRes = await request(app.getHttpServer())
      .patch(`/api/v1/referrals/records/${recordId}/status`)
      .send({ status: 'CONFIRMED' })
      .expect(200);

    expect(updateRes.body.status).toBe('CONFIRMED');

    // 5. Query referral records -> 200
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/referrals/records')
      .query({ referrerId, status: 'CONFIRMED' })
      .expect(200);

    expect(listRes.body.length).toBe(1);
    expect(listRes.body[0].id).toBe(recordId);
    expect(listRes.body[0].status).toBe('CONFIRMED');
  });
});
