import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
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
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

function extractAccessToken(res: request.Response): string {
  const cookies = res.headers['set-cookie'];
  if (!cookies) throw new Error('No set-cookie header');
  const accessCookie = Array.isArray(cookies)
    ? cookies.find((c: string) => c.startsWith('access_token='))
    : cookies;
  if (!accessCookie) throw new Error('No access_token cookie');
  return accessCookie.split(';')[0].replace('access_token=', '');
}

describe('MFA Lifecycle (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let tenantId: string;
  let tenantName: string;
  let adminEmail: string;
  const adminPassword = 'AdminPassword123!';

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-mfa-e2e-tests-that-is-long-enough';
    process.env.MASTER_MFA_KEY = 'master-mfa-key-for-encryption-long-enough';
    process.env.DISABLE_AUTH_VERIFICATION = 'false';

    console.log('Guards:', { JwtAuthGuard, MfaGuard, ThrottlerGuard });

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

    tenantName = `MFA-Tenant-${randomUUID()}`;
    const tenant = await prisma.tenant.create({ data: { name: tenantName } });
    tenantId = tenant.id;

    adminEmail = `admin-${randomUUID()}@hms.local`;
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const user = await prisma.user.create({
      data: {
        tenantId,
        email: adminEmail,
        passwordHash,
        mfaEnabled: false,
      },
    });

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

  describe('Admin Login with MFA setup', () => {
    let mfaToken: string;
    let mfaSecret: string;
    let accessToken: string;

    it('should return 202 MFA_REQUIRED on initial login', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
          tenantCode: tenantName,
        })
        .expect(202);

      expect(res.body.message).toBe('MFA_REQUIRED');
      expect(res.body.challenge).toBe('MFA_SETUP');
      expect(res.body.mfaToken).toBeDefined();
      mfaToken = res.body.mfaToken;
    });

    it('should NOT access protected route with mfaToken', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${mfaToken}`)
        .expect(403); // Blocked by MfaGuard
    });

    it('should setup MFA and get secret', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/setup')
        .set('Authorization', `Bearer ${mfaToken}`)
        .expect(200);

      expect(res.body.secret).toBeDefined();
      expect(res.body.otpauthUrl).toBeDefined();
      mfaSecret = res.body.secret;
    });

    it('should verify MFA and return full tokens', async () => {
      const code = speakeasy.totp({
        secret: mfaSecret,
        encoding: 'base32',
      });
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .set('Authorization', `Bearer ${mfaToken}`)
        .send({ code, secret: mfaSecret })
        .expect(200);

      accessToken = extractAccessToken(res);
      expect(accessToken).toBeDefined();
    });

    it('should access protected route with fully verified AT', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should return MFA_VERIFY on subsequent login', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
          tenantCode: tenantName,
        })
        .expect(202);

      expect(res.body.challenge).toBe('MFA_VERIFY');
      mfaToken = res.body.mfaToken;

      const code = speakeasy.totp({
        secret: mfaSecret,
        encoding: 'base32',
      });
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .set('Authorization', `Bearer ${mfaToken}`)
        .send({ code })
        .expect(200);
    });
  });

  describe('HR and Finance MFA Enforcement', () => {
    let hrAccessToken: string;
    let financeAccessToken: string;
    let hrEmail: string;
    let finEmail: string;

    beforeAll(async () => {
      // Create HR Role
      const hrRole = await prisma.role.create({
        data: { tenantId, name: 'HR', isSystem: true },
      });
      // Create Finance Role
      const finRole = await prisma.role.create({
        data: { tenantId, name: 'Finance', isSystem: true },
      });

      // Add privileged permissions to trigger MFA
      const hrPerm = await prisma.permission.create({
        data: {
          tenantId,
          name: 'hr.manage',
          riskLevel: 'HIGH',
        },
      });
      const finPerm = await prisma.permission.create({
        data: {
          tenantId,
          name: 'finance.manage',
          riskLevel: 'HIGH',
        },
      });

      await prisma.rolePermission.createMany({
        data: [
          { roleId: hrRole.id, permissionId: hrPerm.id },
          { roleId: finRole.id, permissionId: finPerm.id },
        ],
      });

      // Create HR User
      hrEmail = `hr-${randomUUID()}@hms.local`;
      const hrHash = await bcrypt.hash(adminPassword, 10);
      const hrUser = await prisma.user.create({
        data: {
          tenantId,
          email: hrEmail,
          passwordHash: hrHash,
          mfaEnabled: false,
        },
      });
      await prisma.userRole.create({
        data: { userId: hrUser.id, roleId: hrRole.id },
      });

      // Create Finance User
      finEmail = `fin-${randomUUID()}@hms.local`;
      const finHash = await bcrypt.hash(adminPassword, 10);
      const finUser = await prisma.user.create({
        data: {
          tenantId,
          email: finEmail,
          passwordHash: finHash,
          mfaEnabled: false,
        },
      });
      await prisma.userRole.create({
        data: { userId: finUser.id, roleId: finRole.id },
      });

      // Login both to get MFA tokens
      const hrLoginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: hrEmail,
          password: adminPassword,
          tenantCode: tenantName,
        })
        .expect(202);
      const hrMfaToken = hrLoginRes.body.mfaToken;

      const finLoginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: finEmail,
          password: adminPassword,
          tenantCode: tenantName,
        })
        .expect(202);
      const finMfaToken = finLoginRes.body.mfaToken;

      // Setup and verify MFA for HR
      const hrSetupRes = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/setup')
        .set('Authorization', `Bearer ${hrMfaToken}`)
        .expect(200);
      const hrSecret = hrSetupRes.body.secret;
      const hrCode = speakeasy.totp({ secret: hrSecret, encoding: 'base32' });
      const hrVerifyRes = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .set('Authorization', `Bearer ${hrMfaToken}`)
        .send({ code: hrCode, secret: hrSecret })
        .expect(200);
      hrAccessToken = extractAccessToken(hrVerifyRes);

      // Setup and verify MFA for Finance
      const finSetupRes = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/setup')
        .set('Authorization', `Bearer ${finMfaToken}`)
        .expect(200);
      const finSecret = finSetupRes.body.secret;
      const finCode = speakeasy.totp({ secret: finSecret, encoding: 'base32' });
      const finVerifyRes = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .set('Authorization', `Bearer ${finMfaToken}`)
        .send({ code: finCode, secret: finSecret })
        .expect(200);
      financeAccessToken = extractAccessToken(finVerifyRes);
    });

    it('should allow HR user with verified MFA to access protected route', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${hrAccessToken}`)
        .expect(200);
    });

    it('should allow Finance user with verified MFA to access protected route', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${financeAccessToken}`)
        .expect(200);
    });

    it('should block HR user without verified MFA', async () => {
      // Login HR user again to get unverified token
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: hrEmail,
          password: adminPassword,
          tenantCode: tenantName,
        })
        .expect(202);
      const unverifiedToken = res.body.mfaToken;

      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .expect(403);
    });

    it('should block Finance user without verified MFA', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: finEmail,
          password: adminPassword,
          tenantCode: tenantName,
        })
        .expect(202);
      const unverifiedToken = res.body.mfaToken;

      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .expect(403);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
