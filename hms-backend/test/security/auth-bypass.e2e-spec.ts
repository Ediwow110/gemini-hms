import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';

describe('OWASP Broken Authentication & Access Control Bypass Tests (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  const tenantA = '00000000-0000-0000-0000-00000000000a';
  const tenantB = '00000000-0000-0000-0000-00000000000b';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    jwtService = app.get(JwtService);
  });

  it('1. should reject access to protected admin endpoints without auth token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/health')
      .set('X-Tenant-ID', tenantA);

    expect(res.status).toBe(401);
  });

  it('2. should reject accessing tenant-B data using a tenant-A token (Cross-Tenant Access)', async () => {
    const tokenA = jwtService.sign({
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId: tenantA,
      email: 'admin@hospitalA.com',
      roles: ['Super Admin'],
      branchId: '123e4567-e89b-12d3-a456-426614174001',
    });
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/health')
      .set('X-Tenant-ID', tenantB)
      .set('Authorization', `Bearer ${tokenA}`);

    expect([401, 403]).toContain(res.status);
  });

  it('3. should reject expired token access', async () => {
    const expiredToken = jwtService.sign(
      {
        userId: '11111111-1111-4111-8111-111111111111',
        tenantId: tenantA,
        roles: ['Super Admin'],
      },
      { expiresIn: '-1s' },
    );

    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/health')
      .set('X-Tenant-ID', tenantA)
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });

  it('4. should reject token with a tampered/modified signature', async () => {
    const validToken = jwtService.sign({
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId: tenantA,
      roles: ['Super Admin'],
    });

    const parts = validToken.split('.');
    const tamperedSignature =
      parts[2].substring(0, parts[2].length - 4) + 'AAAA';
    const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignature}`;

    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/health')
      .set('X-Tenant-ID', tenantA)
      .set('Authorization', `Bearer ${tamperedToken}`);

    expect(res.status).toBe(401);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
