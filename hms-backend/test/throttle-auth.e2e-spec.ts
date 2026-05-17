import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthTestModule } from './helpers/auth-test.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedUser } from './helpers/seed.helper';
import { randomUUID } from 'crypto';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';

describe('Throttler: Auth Login (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let uniqueTenantName: string;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleRef = await Test.createTestingModule({
      imports: [
        AuthTestModule,
        ThrottlerModule.forRoot([
          {
            name: 'auth',
            ttl: 60000,
            limit: 5,
          },
        ]),
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
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
    uniqueTenantName = `Throttle-Tenant-${randomUUID()}`;
    const tenant = await prisma.tenant.create({
      data: { name: uniqueTenantName },
    });
    await seedUser(prisma, tenant.id, 'throttle@hms.local');
  });

  it('should return 429 after 5 login attempts', async () => {
    const loginData = {
      email: 'throttle@hms.local',
      password: 'WrongPassword',
      tenantCode: uniqueTenantName,
    };

    // 1-5 attempts (Unauthorized)
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);
    }

    // 6th attempt
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(loginData);

    expect(res.status).toBe(429);
  });

  afterAll(async () => {
    await app.close();
  });
});
