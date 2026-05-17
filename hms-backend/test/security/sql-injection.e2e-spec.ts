import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('OWASP SQL Injection Penetration Tests (e2e)', () => {
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

  const sqliPayloads = [
    "' OR '1'='1",
    "' OR 1=1 --",
    "'; DROP TABLE tenants; --",
    "UNION SELECT null, null, null --",
    "admin'--",
  ];

  it('should reject or handle gracefully SQL injection payloads in query parameters', async () => {
    for (const payload of sqliPayloads) {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/auth/login`)
        .set('X-Tenant-ID', tenantId)
        .send({
          tenantCode: 'demo-tenant',
          email: payload,
          password: 'Password123!',
        });

      // SQLi queries must either be safely handled yielding Unauthorized (401),
      // rejected as Bad Request (400), or return Not Found (404).
      // Crucially, they must NEVER leak database internal syntax errors (500).
      expect([401, 400, 404]).toContain(res.status);

      // Assert no database syntax errors or database stack traces are leaked in the response
      const responseText = JSON.stringify(res.body);
      expect(responseText).not.toContain('syntax error');
      expect(responseText).not.toContain('postgresql');
      expect(responseText).not.toContain('prisma');
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
