import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, APP_GUARD } from '@nestjs/common';
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
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

describe('MFA Lifecycle (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  let tenantId: string;
  let tenantName: string;
  let adminEmail: string;
  const adminPassword = 'AdminPassword123!';

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-mfa-e2e-tests-that-is-long-enough';
    process.env.MASTER_MFA_KEY = 'master-mfa-key-for-encryption-long-enough';
    
    console.log('Guards:', { JwtAuthGuard, MfaGuard, ThrottlerGuard });

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
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
        }
    });

    const role = await prisma.role.create({
        data: {
            tenantId,
            name: 'Super Admin',
            isSystem: true,
        }
    });

    await prisma.userRole.create({
        data: {
            userId: user.id,
            roleId: role.id,
        }
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
          encoding: 'base32'
      });
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .set('Authorization', `Bearer ${mfaToken}`)
        .send({ code, secret: mfaSecret })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      accessToken = res.body.accessToken;
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
            encoding: 'base32'
        });
        await request(app.getHttpServer())
          .post('/api/v1/auth/mfa/verify')
          .set('Authorization', `Bearer ${mfaToken}`)
          .send({ code })
          .expect(200);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
