process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests-that-is-long-enough';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'crypto';
import cookieParser from 'cookie-parser';
import { AuthTestModule } from './helpers/auth-test.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedUser } from './helpers/seed.helper';
import { cleanupDatabase } from './helpers/db-cleanup';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';

describe('Auth Selection (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let uniqueTenantName: string;
  let testUserEmail: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthTestModule],
      providers: [
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.use(cookieParser());
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupDatabase(prisma);

    uniqueTenantName = `Auth-Tenant-${randomUUID()}`;
    const tenant = await prisma.tenant.create({
      data: { name: uniqueTenantName },
    });
    testUserEmail = `auth-${randomUUID()}@hms.local`;
    await seedUser(prisma, tenant.id, testUserEmail);
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 200 and set auth cookie for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: 'Test1234!',
          tenantCode: uniqueTenantName,
        });

      expect(res.status).toBe(200);
      // Response body should contain message and user, not accessToken
      expect(res.body.message).toBe('Authenticated');
      expect(res.body.user).toBeDefined();
      // Check that set-cookie header contains auth cookies
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const allCookies = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(allCookies).toContain('access_token');
      expect(allCookies).toContain('csrf_token');
    });

    it('should return 401 for invalid password', async () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: 'WrongPassword',
          tenantCode: uniqueTenantName,
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user context with valid cookie', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: 'Test1234!',
          tenantCode: uniqueTenantName,
        });

      // Extract access_token cookie from set-cookie header
      const cookies = loginRes.headers['set-cookie'];
      const accessCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('access_token='))
        : cookies;
      expect(accessCookie).toBeDefined();

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', accessCookie)
        .expect(200);

      expect(res.body.email).toBe(testUserEmail);
    });

    it('should return 401 without cookie', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
