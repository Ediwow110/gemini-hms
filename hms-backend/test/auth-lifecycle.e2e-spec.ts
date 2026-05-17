import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthTestModule } from './helpers/auth-test.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedUser } from './helpers/seed.helper';
import { cleanupDatabase } from './helpers/db-cleanup';
import { randomUUID } from 'crypto';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { ThrottlerModule } from '@nestjs/throttler';

describe('Auth E2E Lifecycle (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantId: string;
  let tenantName: string;
  let userEmail: string;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleRef = await Test.createTestingModule({
      imports: [
        AuthTestModule,
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60000,
            limit: 100,
          },
        ]),
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupDatabase(prisma);

    tenantName = `Lifecycle-Tenant-${randomUUID()}`;
    const tenant = await prisma.tenant.create({ data: { name: tenantName } });
    tenantId = tenant.id;
    userEmail = `lifecycle-${randomUUID()}@hms.local`;
    await seedUser(prisma, tenantId, userEmail);
  });

  describe('Auth Flow: Login -> Refresh -> Logout', () => {
    let accessToken: string;
    let refreshToken: string;
    let sessionId: string;

    it('should login and return AT + RT', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: userEmail,
          password: 'Test1234!',
          tenantCode: tenantName,
        })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;

      // Decode JWT to get session ID (sid)
      const payload = JSON.parse(
        Buffer.from(accessToken.split('.')[1], 'base64').toString(),
      );
      sessionId = payload.sid;
      expect(sessionId).toBeDefined();
    });

    it('should refresh tokens using valid RT', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken,
          sessionId,
          userId: (await prisma.user.findFirst({ where: { email: userEmail } }))
            ?.id,
        })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.refreshToken).not.toBe(refreshToken); // Rotated

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should allow access to protected route with AT', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should logout and invalidate session', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Verify session is gone from DB
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });
      expect(session).toBeNull();

      // Subsequent request with same AT should fail (stateful check)
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
