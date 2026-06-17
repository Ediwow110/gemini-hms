import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
  let tenantId: string;
  let branchId: string;
  let otherTenantId: string;
  let actorUserId: string;

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
    tenantId = tenant.id;
    const branch = await prisma.branch.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
        name: 'Queue Branch',
        code: `QB-${randomUUID().substring(0, 4)}`,
      },
    });
    branchId = branch.id;

    const otherTenant = await prisma.tenant.create({
      data: { name: `Other-Queue-Tenant-${randomUUID()}` },
    });
    otherTenantId = otherTenant.id;

    // Create a real actor user so the audit_log FK constraint is satisfied.
    // The MockJwtAuthGuard returns this id in the JWT.
    const actor = await prisma.user.create({
      data: {
        tenantId,
        email: `queue-actor-${randomUUID()}@hms.local`,
        passwordHash: 'unused',
        status: 'ACTIVE',
      },
    });
    actorUserId = actor.id;

    MockJwtAuthGuard.user.tenantId = tenantId;
    MockJwtAuthGuard.user.branchId = branchId;
    MockJwtAuthGuard.user.userId = actorUserId;
  });

  beforeEach(() => {
    MockJwtAuthGuard.user = {
      userId: actorUserId,
      tenantId,
      branchId,
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

    it('should reject with 400 when patientId belongs to a different tenant', async () => {
      // Create a patient in a DIFFERENT tenant
      const otherPatient = await prisma.patient.create({
        data: {
          tenantId: otherTenantId,
          patientNumber: `PT-OTHER-${randomUUID().substring(0, 6)}`,
          firstName: 'Other',
          lastName: 'Tenant',
          dob: new Date('1990-01-01'),
        },
      });

      return request(app.getHttpServer())
        .post('/api/v1/queue/join')
        .send({
          serviceType: 'RECEPTION',
          branchId,
          patientId: otherPatient.id,
        })
        .expect(400);
    });

    it('should accept and write audit log when patientId belongs to same tenant', async () => {
      const samePatient = await prisma.patient.create({
        data: {
          tenantId,
          patientNumber: `PT-SAME-${randomUUID().substring(0, 6)}`,
          firstName: 'Same',
          lastName: 'Tenant',
          dob: new Date('1990-01-01'),
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/queue/join')
        .send({
          serviceType: 'RECEPTION',
          branchId,
          patientId: samePatient.id,
        })
        .expect(201);

      expect(res.body.patientId).toBe(samePatient.id);

      // Verify audit log was written
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          tenantId,
          eventKey: 'QUEUE_ENTRY_CREATED',
          recordId: res.body.id,
        },
      });
      expect(auditLog).not.toBeNull();
      expect(auditLog?.userId).toBe(actorUserId);
      expect(auditLog?.branchId).toBe(branchId);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
