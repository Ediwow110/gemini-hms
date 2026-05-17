process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests-that-is-long-enough';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'crypto';
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
          }
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupDatabase(prisma);

    uniqueTenantName = `Auth-Tenant-${randomUUID()}`;
    const tenant = await prisma.tenant.create({
        data: { name: uniqueTenantName }
    });
    testUserEmail = `auth-${randomUUID()}@hms.local`;
    await seedUser(prisma, tenant.id, testUserEmail);
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 200 and accessToken for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: 'Test1234!',
          tenantCode: uniqueTenantName, 
        });
      
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
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
    it('should return user context with valid token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: 'Test1234!',
          tenantCode: uniqueTenantName,
        });
      
      const token = loginRes.body.accessToken;

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(res.body.email).toBe(testUserEmail);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
