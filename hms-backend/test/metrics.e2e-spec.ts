import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AdminModule } from '../src/admin/admin.module';
import { AuditModule } from '../src/audit/audit.module';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';

describe('Prometheus Observability Metrics (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const tenantId = '00000000-0000-0000-0000-00000000000e';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AdminModule, AuditModule],
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
    
    // Seed tenant
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: {
        id: tenantId,
        name: 'metrics-tenant',
        status: 'ACTIVE',
      },
    });
  });

  it('should reject unauthorized role from accessing prometheus metrics', async () => {
    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId,
      email: 'doctor@hospital.com',
      roles: ['Doctor'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    const res = await request(app.getHttpServer())
      .get('/metrics')
      .set('X-Tenant-ID', tenantId);

    expect(res.status).toBe(403);
  });

  it('should allow Super Admin role to fetch metrics in Prometheus scrapable format', async () => {
    MockJwtAuthGuard.user = {
      userId: '22222222-2222-4222-8222-222222222222',
      tenantId,
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: [],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    };

    const res = await request(app.getHttpServer())
      .get('/metrics')
      .set('X-Tenant-ID', tenantId);

    expect(res.status).toBe(200);
    expect(res.text).toContain('hms_requests_total');
    expect(res.text).toContain('hms_memory_rss_bytes');
    expect(res.text).toContain('hms_database_healthy');
    expect(res.text).toContain('hms_sla_triggered_alerts_total');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
