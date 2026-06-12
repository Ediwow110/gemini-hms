import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../src/auth/auth.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { cleanupDatabase } from './helpers/db-cleanup';
import { seedUser } from './helpers/seed.helper';
import { randomUUID } from 'crypto';

describe('Auth Branches (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        AuthModule,
        JwtModule.register({
          secret: 'test-secret-key-for-e2e-tests-that-is-long-enough',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalGuards(new MockJwtAuthGuard());
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupDatabase(prisma);

    const tenant = await prisma.tenant.create({
      data: { name: `AuthBr-Tenant-${randomUUID()}` },
    });
    MockJwtAuthGuard.user.tenantId = tenant.id;
    MockJwtAuthGuard.user.userId = '11111111-1111-4111-8111-111111111111';

    await seedUser(prisma, tenant.id, 'auth-branches@hms.local');
  });

  describe('GET /api/v1/auth/branches', () => {
    it('should return active branch assignments', async () => {
      const branchId1 = randomUUID();

      // Seed a branch and assignment
      await prisma.branch.create({
        data: {
          id: branchId1,
          tenantId: MockJwtAuthGuard.user.tenantId,
          name: 'B1',
          code: 'B1',
        },
      });
      await prisma.userBranch.create({
        data: {
          userId: MockJwtAuthGuard.user.userId,
          branchId: branchId1,
          tenantId: MockJwtAuthGuard.user.tenantId,
          isActive: true,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/branches')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(branchId1);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
