import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { ReplicationModule } from '../src/replication/replication.module';

describe('Multi-Region Active-Active Replication (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const tenantId = '00000000-0000-0000-0000-00000000000c';

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';
    process.env.NODE_ENV = 'test';
    process.env.REGION_HEALTH_ENABLED = 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        ReplicationModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: MockJwtAuthGuard,
        },
        {
          provide: APP_GUARD,
          useClass: RolesGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Upsert tenant
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: { id: tenantId, name: 'replication-tenant', status: 'ACTIVE' },
    });

    // Seed system user for foreign key constraints in replication audit logs
    const systemUserId = '00000000-0000-0000-0000-000000000000';
    await prisma.user.upsert({
      where: { id: systemUserId },
      update: {},
      create: {
        id: systemUserId,
        tenantId,
        email: 'system-replication@hospital.com',
        passwordHash: 'dummy-hash',
        status: 'ACTIVE',
      },
    });
  });

  it('should block non-ADMIN from accessing replication routes (403)', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId,
      email: 'cashier@hospital.com',
      roles: ['CASHIER'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/replication/regions')
      .expect(403);
  });

  it('should allow Super Admin to query regional replica health status', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/replication/regions')
      .expect(200)
      .expect((res) => {
        expect(res.body.activeRegion).toBeDefined();
        expect(res.body.regions['us-east-1']).toBeDefined();
        expect(res.body.regions['us-east-1'].status).toBe('HEALTHY');
      });
  });

  it('should allow Super Admin to query active concurrent replication conflicts', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .get('/api/v1/replication/conflicts?entityType=Patient')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body[0].entityType).toBe('Patient');
        expect(res.body[0].regionsInvolved).toContain('us-east-1');
      });
  });

  it('should successfully trigger manual record replication sync', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await request(app.getHttpServer())
      .post(
        '/api/v1/replication/sync/Patient/c8711e74-279c-4eb2-a63d-4781b28d7a12',
      )
      .send({ targetRegion: 'eu-west-1' })
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe('STUBBED');
        expect(res.body.targetRegion).toBe('eu-west-1');
      });
  });

  it('should resolve cross-region concurrent conflicts using Last-Write-Wins strategy', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111112',
      tenantId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    const stateA = {
      region: 'us-east-1',
      updatedAt: new Date().toISOString(),
      updatedBy: 'dr-smith-us',
      payload: { status: 'COMPLETED', remarks: 'US Patient chart updated' },
    };

    const fiveSecondsAgo = new Date();
    fiveSecondsAgo.setSeconds(fiveSecondsAgo.getSeconds() - 5);

    const stateB = {
      region: 'eu-west-1',
      updatedAt: fiveSecondsAgo.toISOString(),
      updatedBy: 'dr-jones-eu',
      payload: { status: 'IN_PROGRESS', remarks: 'EU Patient chart updated' },
    };

    await request(app.getHttpServer())
      .post(
        '/api/v1/replication/resolve/Patient/c8711e74-279c-4eb2-a63d-4781b28d7a12',
      )
      .send({ stateA, stateB })
      .expect(201)
      .expect((res) => {
        expect(res.body.strategy).toBe('LAST_WRITE_WINS');
        // stateA is newer, so it should be chosen as winner
        expect(res.body.winningRegion).toBe('us-east-1');
        expect(res.body.mergedPayload.status).toBe('COMPLETED');
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
