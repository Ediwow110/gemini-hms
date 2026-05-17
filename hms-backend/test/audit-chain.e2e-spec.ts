import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { AuditModule } from '../src/audit/audit.module';
import { AuditService } from '../src/audit/audit.service';
import { randomUUID } from 'crypto';

describe('Audit Chain of Custody (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let auditService: AuditService;

  const tenantId = '00000000-0000-0000-0000-00000000000d';
  const userId = '11111111-1111-4111-8111-111111111111';

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        AuditModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: MockJwtAuthGuard,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    auditService = app.get(AuditService);

    // Upsert tenant & user in test DB to satisfy foreign keys
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: {
        id: tenantId,
        name: 'audit-tenant',
        status: 'ACTIVE',
      },
    });

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        tenantId,
        email: 'audit-user@hms.local',
        passwordHash: 'dummy-hash',
      },
    });

    // Temporarily disable the immutable trigger during cleanup if needed, or simply delete logs
    await prisma.$executeRawUnsafe('ALTER TABLE audit_logs DISABLE TRIGGER audit_log_immutable;');
    try {
      await prisma.auditLog.deleteMany({
        where: { tenantId },
      });
    } finally {
      await prisma.$executeRawUnsafe('ALTER TABLE audit_logs ENABLE TRIGGER audit_log_immutable;');
    }
  });

  it('should successfully chain multiple logs chronologically and detect database tampering', async () => {
    MockJwtAuthGuard.user = {
      userId,
      tenantId,
      email: 'audit-user@hms.local',
      roles: ['Super Admin'],
      permissions: ['audit.view'],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    // 1. Create a chain of 3 audit logs
    const log1 = await auditService.log({
      tenantId,
      userId,
      eventKey: 'patient.create',
      recordType: 'Patient',
      recordId: randomUUID(),
      newValues: { name: 'Alice' },
    });

    // Wait slightly to ensure strictly chronological sorting by createdAt
    await new Promise((resolve) => setTimeout(resolve, 50));

    const log2 = await auditService.log({
      tenantId,
      userId,
      eventKey: 'patient.update',
      recordType: 'Patient',
      recordId: log1.recordId,
      oldValues: { name: 'Alice' },
      newValues: { name: 'Alice Smith' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const log3 = await auditService.log({
      tenantId,
      userId,
      eventKey: 'patient.delete',
      recordType: 'Patient',
      recordId: log1.recordId,
      oldValues: { name: 'Alice Smith' },
    });

    // 2. Validate cryptographic hash linkages
    expect(log1.previousHash).toBeNull();
    expect(log1.hash).toBeDefined();

    expect(log2.previousHash).toBe(log1.hash);
    expect(log2.hash).toBeDefined();

    expect(log3.previousHash).toBe(log2.hash);
    expect(log3.hash).toBeDefined();

    // 3. Verify custody chain via API
    await request(app.getHttpServer())
      .get('/audit/verify')
      .expect(200)
      .expect((res) => {
        expect(res.body.isValid).toBe(true);
        expect(res.body.corruptedLogIds).toHaveLength(0);
      });

    // 4. Simulate malicious tampering on the database by temporarily disabling the immutability trigger
    await prisma.$executeRawUnsafe('ALTER TABLE audit_logs DISABLE TRIGGER audit_log_immutable;');
    try {
      await prisma.auditLog.update({
        where: { id: log2.id },
        data: {
          newValues: { name: 'Tampered Value' },
        },
      });
    } finally {
      await prisma.$executeRawUnsafe('ALTER TABLE audit_logs ENABLE TRIGGER audit_log_immutable;');
    }

    // 5. Verify custody chain detection of tampering
    await request(app.getHttpServer())
      .get('/audit/verify')
      .expect(200)
      .expect((res) => {
        expect(res.body.isValid).toBe(false);
        expect(res.body.corruptedLogIds).toContain(log2.id);
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
