import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from '../src/audit/audit.module';
import { cleanupDatabase } from './helpers/db-cleanup';
import { randomUUID } from 'crypto';

describe('Audit Log Immutability (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantId: string;
  let userId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-for-audit-immutability-long-enough';
    
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        AuditModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupDatabase(prisma);

    const tenant = await prisma.tenant.create({ data: { name: 'Audit-Tenant' } });
    tenantId = tenant.id;
    
    const user = await prisma.user.create({
      data: { tenantId, email: 'audit-test@hms.local', passwordHash: 'hash' },
    });
    userId = user.id;
  });

  it('should prevent UPDATE on audit_logs via DB trigger', async () => {
    // Create an audit log
    const auditLog = await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        eventKey: 'TEST_CREATE',
        recordType: 'Test',
        recordId: randomUUID(),
      },
    });

    // Attempt to update
    await expect(
      prisma.auditLog.update({
        where: { id: auditLog.id },
        data: { eventKey: 'TEST_MODIFIED' },
      }),
    ).rejects.toThrow();
  });

  it('should prevent DELETE on audit_logs via DB trigger', async () => {
    // Create an audit log
    const auditLog = await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        eventKey: 'TEST_DELETE',
        recordType: 'Test',
        recordId: randomUUID(),
      },
    });

    // Attempt to delete
    await expect(
      prisma.auditLog.delete({ where: { id: auditLog.id } }),
    ).rejects.toThrow();
  });

  afterAll(async () => {
    await app.close();
  });
});
