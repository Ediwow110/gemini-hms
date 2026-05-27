import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { AuditModule } from '../src/audit/audit.module';
import { cleanupDatabase } from './helpers/db-cleanup';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { MfaGuard } from '../src/auth/guards/mfa.guard';
import { ThrottlerModule } from '@nestjs/throttler';

function extractAccessToken(res: request.Response): string {
  const cookies = res.headers['set-cookie'];
  if (!cookies) throw new Error('No set-cookie header');
  const accessCookie = Array.isArray(cookies)
    ? cookies.find((c: string) => c.startsWith('access_token='))
    : cookies;
  if (!accessCookie) throw new Error('No access_token cookie');
  return accessCookie.split(';')[0].replace('access_token=', '');
}

describe('MFA Recovery (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let tenantId: string;
  let tenantName: string;
  let adminEmail: string;
  let adminUserId: string;
  const adminPassword = 'AdminPassword123!';

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-mfa-recovery-e2e-tests-long-enough';
    process.env.MASTER_MFA_KEY = 'master-mfa-key-for-encryption-long-enough';
    process.env.DISABLE_AUTH_VERIFICATION = 'false';

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        AuditModule,
        AuthModule,
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    const reflector = app.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector));
    app.useGlobalGuards(new MfaGuard(reflector));

    await app.init();

    prisma = app.get(PrismaService);
    await cleanupDatabase(prisma);

    tenantName = `MFA-Rec-Tenant-${randomUUID()}`;
    const tenant = await prisma.tenant.create({ data: { name: tenantName } });
    tenantId = tenant.id;

    adminEmail = `admin-rec-${randomUUID()}@hms.local`;
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const user = await prisma.user.create({
      data: {
        tenantId,
        email: adminEmail,
        passwordHash,
        mfaEnabled: false,
      },
    });
    adminUserId = user.id;

    const role = await prisma.role.create({
      data: {
        tenantId,
        name: 'Super Admin',
        isSystem: true,
      },
    });

    const permission = await prisma.permission.create({
      data: {
        tenantId,
        name: 'admin.super.all',
        riskLevel: 'CRITICAL',
      },
    });

    await prisma.rolePermission.create({
      data: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });
  });

  describe('MFA Recovery Codes Flow', () => {
    let mfaToken: string;
    let mfaSecret: string;
    let accessToken: string;
    let recoveryCodes: string[] = [];

    it('should setup MFA first', async () => {
      // 1. Initial Login
      let res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
          tenantCode: tenantName,
        })
        .expect(202);

      mfaToken = res.body.mfaToken;

      // 2. Setup MFA
      res = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/setup')
        .set('Authorization', `Bearer ${mfaToken}`)
        .expect(200);

      mfaSecret = res.body.secret;

      // 3. Verify MFA
      const code = speakeasy.totp({
        secret: mfaSecret,
        encoding: 'base32',
      });
      res = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .set('Authorization', `Bearer ${mfaToken}`)
        .send({ code, secret: mfaSecret })
        .expect(200);

      accessToken = extractAccessToken(res);
      expect(accessToken).toBeDefined();
    });

    it('should generate recovery codes for MFA-enabled user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/recovery-codes/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(res.body.recoveryCodes).toBeDefined();
      expect(res.body.recoveryCodes.length).toBe(8);
      recoveryCodes = res.body.recoveryCodes;

      // Check if audit log contains MFA_RECOVERY_CODES_GENERATED
      const logs = await prisma.auditLog.findMany({
        where: {
          userId: adminUserId,
          eventKey: 'MFA_RECOVERY_CODES_GENERATED',
        },
      });
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should ensure no plaintext recovery code is stored in DB', async () => {
      const dbCodes = await prisma.userMfaRecoveryCode.findMany({
        where: { userId: adminUserId },
      });
      expect(dbCodes.length).toBe(8);

      for (const dbCode of dbCodes) {
        // Plaintext codes should not match any codeHash directly in plaintext
        expect(recoveryCodes).not.toContain(dbCode.codeHash);
        // Hashing check: it should be a bcrypt hash (starts with $2b$ or $2a$)
        expect(dbCode.codeHash.startsWith('$2')).toBe(true);
      }
    });

    it('should verify MFA using a valid recovery code and burn it', async () => {
      // 1. Initial Login again to get a fresh mfaToken
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
          tenantCode: tenantName,
        })
        .expect(202);

      const challengeToken = loginRes.body.mfaToken;
      expect(loginRes.body.challenge).toBe('MFA_VERIFY');

      // 2. Verify with valid recovery code
      const verifyRes = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/recovery-codes/verify')
        .set('Authorization', `Bearer ${challengeToken}`)
        .send({ code: recoveryCodes[0] })
        .expect(200);

      expect(verifyRes.headers['set-cookie']).toBeDefined();

      // 3. Confirm that the used code is marked used/burned in the DB
      const dbCodes = await prisma.userMfaRecoveryCode.findMany({
        where: { userId: adminUserId },
      });
      const usedCode = dbCodes.find((c) => c.usedAt !== null);
      expect(usedCode).toBeDefined();

      // 4. Verify audit log has MFA_RECOVERY_CODE_USED
      const usedLogs = await prisma.auditLog.findMany({
        where: { userId: adminUserId, eventKey: 'MFA_RECOVERY_CODE_USED' },
      });
      expect(usedLogs.length).toBeGreaterThan(0);
    });

    it('should refuse to reuse a burned recovery code', async () => {
      // 1. Initial Login again to get a fresh mfaToken
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
          tenantCode: tenantName,
        })
        .expect(202);

      const challengeToken = loginRes.body.mfaToken;

      // 2. Attempt to verify with the SAME burned code
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/recovery-codes/verify')
        .set('Authorization', `Bearer ${challengeToken}`)
        .send({ code: recoveryCodes[0] })
        .expect(401);

      // Verify audit log has MFA_RECOVERY_CODE_REJECTED
      const rejectedLogs = await prisma.auditLog.findMany({
        where: { userId: adminUserId, eventKey: 'MFA_RECOVERY_CODE_REJECTED' },
      });
      expect(rejectedLogs.length).toBeGreaterThan(0);
    });

    it('should refuse an invalid recovery code', async () => {
      // 1. Initial Login again to get a fresh mfaToken
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
          tenantCode: tenantName,
        })
        .expect(202);

      const challengeToken = loginRes.body.mfaToken;

      // 2. Attempt to verify with an invalid code
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/recovery-codes/verify')
        .set('Authorization', `Bearer ${challengeToken}`)
        .send({ code: 'completely-invalid-code' })
        .expect(401);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
