import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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

describe('Auth Lifecycle & Lockout (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tenantId: string;
  let tenantName: string;
  const testPassword = 'SecurePassword123!';

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-for-lockout-e2e-that-is-long-enough';
    process.env.MASTER_MFA_KEY = 'master-key-for-lockout-e2e-long-enough';

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        AuditModule,
        AuthModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupDatabase(prisma);

    tenantName = `Lockout-Tenant-${randomUUID()}`;
    const tenant = await prisma.tenant.create({ data: { name: tenantName } });
    tenantId = tenant.id;
  });

  describe('Account Lockout Policy', () => {
    let userEmail: string;

    beforeEach(async () => {
      userEmail = `lockout-${randomUUID()}@hms.local`;
      const hash = await bcrypt.hash(testPassword, 10);
      await prisma.user.create({
        data: { tenantId, email: userEmail, passwordHash: hash },
      });
    });

    it('should lock account after 5 failed login attempts', async () => {
      const loginData = {
        email: userEmail,
        password: 'WrongPassword',
        tenantCode: tenantName,
      };

      // 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginData)
          .expect(401);
      }

      // 6th attempt should return account_locked
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('account_locked');
      expect(res.body.lockedUntil).toBeDefined();
    });

    it('should prevent login while account is locked', async () => {
      // Trigger lockout first
      const wrongLogin = {
        email: userEmail,
        password: 'WrongPassword123',
        tenantCode: tenantName,
      };
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(wrongLogin)
          .expect(401);
      }

      // Try correct password while locked
      const correctLogin = {
        email: userEmail,
        password: testPassword,
        tenantCode: tenantName,
      };
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(correctLogin);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('account_locked');
    });

    it('should reset failed attempts on successful login', async () => {
      // 2 failed attempts
      const wrongLogin = {
        email: userEmail,
        password: 'WrongPassword123',
        tenantCode: tenantName,
      };
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(wrongLogin);
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(wrongLogin);

      // Successful login
      const correctLogin = {
        email: userEmail,
        password: testPassword,
        tenantCode: tenantName,
      };
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(correctLogin);

      // Should succeed (200 or 202 depending on MFA)
      expect([200, 202]).toContain(res.status);

      // Verify attempts reset in DB
      const user = await prisma.user.findFirst({ where: { email: userEmail } });
      expect(user?.failedLoginAttempts).toBe(0);
      expect(user?.lockedUntil).toBeNull();
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
