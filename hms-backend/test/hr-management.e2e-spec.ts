import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { HrModule } from '../src/hr/hr.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { randomUUID } from 'crypto';

describe('HR Management E2E', () => {
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
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        HrModule,
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
      data: { name: `HR-Tenant-${randomUUID()}` },
    });
    tenantId = tenant.id;

    const branch = await prisma.branch.create({
      data: {
        tenantId,
        name: 'HR Test Branch',
        code: `HRB-${randomUUID().substring(0, 4)}`,
      },
    });
    branchId = branch.id;
  });

  beforeEach(() => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId: tenantId,
      branchId: branchId,
      roles: ['Super Admin'],
      permissions: ['*'],
      email: 'admin@hms.local',
    };
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should restrict employee creation to HR Admin / manager roles', async () => {
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
      .post('/api/v1/hr/employees')
      .send({
        branchId,
        department: 'Clinical EMR',
        position: 'Resident Physician',
        hireDate: new Date().toISOString(),
        firstName: 'Marcus',
        lastName: 'Aurelius',
      })
      .expect(403);
  });

  it('should allow HR Admin to create employee profile', async () => {
    const hrAdminId = await createTestUser();
    MockJwtAuthGuard.user = {
      userId: hrAdminId,
      tenantId,
      branchId,
      roles: ['HR Manager'],
      permissions: ['*'],
      email: 'hradmin@hms.local',
    };

    const linkedUser = await prisma.user.create({
      data: {
        tenantId,
        email: `employee-${randomUUID()}@hms.local`,
        passwordHash: 'dummy',
        status: 'ACTIVE',
      },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/hr/employees')
      .send({
        userId: linkedUser.id,
        branchId,
        department: 'Operations',
        position: 'Clerk',
        hireDate: new Date().toISOString(),
        firstName: 'John',
        lastName: 'Wick',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.employeeNumber).toBeDefined();
    expect(res.body.userId).toBe(linkedUser.id);
    expect(res.body.status).toBe('ACTIVE');

    const employeeId = res.body.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/hr/employees/${employeeId}/status`)
      .send({ status: 'TERMINATED' })
      .expect(200);

    const updatedUser = await prisma.user.findUnique({
      where: { id: linkedUser.id },
    });
    expect(updatedUser?.status).toBe('INACTIVE');
    expect(updatedUser?.deactivatedAt).toBeDefined();
  });

  it('should handle leave requests and prevent self-approval', async () => {
    const doctorUserId = await createTestUser();
    MockJwtAuthGuard.user = {
      userId: doctorUserId,
      tenantId,
      branchId,
      roles: ['Doctor'],
      permissions: ['*'],
      email: 'doctor2@hms.local',
    };

    const doctorEmployee = await prisma.employee.create({
      data: {
        tenantId,
        branchId,
        userId: doctorUserId,
        employeeNumber: `EMP-${randomUUID().substring(0, 5)}`,
        department: 'Clinical',
        position: 'Doctor',
        hireDate: new Date(),
        status: 'ACTIVE',
      },
    });

    const createRes = await request(app.getHttpServer())
      .post('/api/v1/hr/leave-requests')
      .send({
        employeeId: doctorEmployee.id,
        type: 'VACATION',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        reason: 'Resting',
      })
      .expect(201);

    const leaveId = createRes.body.id;
    expect(leaveId).toBeDefined();
    expect(createRes.body.status).toBe('PENDING');

    await request(app.getHttpServer())
      .patch(`/api/v1/hr/leave-requests/${leaveId}/approve`)
      .expect(403);

    const managerUserId = await createTestUser();
    MockJwtAuthGuard.user = {
      userId: managerUserId,
      tenantId,
      branchId,
      roles: ['Branch Admin'],
      permissions: ['*'],
      email: 'hradmin2@hms.local',
    };

    const approveRes = await request(app.getHttpServer())
      .patch(`/api/v1/hr/leave-requests/${leaveId}/approve`)
      .expect(200);

    expect(approveRes.body.status).toBe('APPROVED');
    expect(approveRes.body.approvedById).toBe(managerUserId);
  });
});
