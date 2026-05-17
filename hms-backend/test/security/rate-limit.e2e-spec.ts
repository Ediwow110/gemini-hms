import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Rate Limiting DDoS Prevention Tests (e2e)', () => {
  let app: INestApplication;
  const tenantId = '00000000-0000-0000-0000-00000000000e';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  it('should trigger rate limiting (429) after 5 successive login requests', async () => {
    const loginPayload = {
      tenantCode: 'demo-tenant',
      email: 'non-existent@hospital.com',
      password: 'WrongPassword123!',
    };

    // First 5 requests should get 401 Unauthorized (because of wrong password)
    for (let i = 0; i < 5; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Tenant-ID', tenantId)
        .send(loginPayload);

      expect(res.status).toBe(401);
    }

    // The 6th request must trigger the throttler, returning 429 Too Many Requests
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Tenant-ID', tenantId)
      .send(loginPayload);

    expect(res.status).toBe(429);
    expect(res.body.message).toContain('ThrottlerException');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
