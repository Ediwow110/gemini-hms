import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('OWASP Cross-Site Scripting (XSS) Penetration Tests (e2e)', () => {
  let app: INestApplication<App>;
  const tenantId = '00000000-0000-0000-0000-00000000000e';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  const xssPayloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
  ];

  it('should reject or sanitize XSS payloads in string input fields during login', async () => {
    for (const payload of xssPayloads) {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/auth/login`)
        .set('X-Tenant-ID', tenantId)
        .send({
          tenantCode: payload,
          email: 'xss-test@hospital.com',
          password: 'Password123!',
        });

      // Payloads must either be rejected with bad request (400) OR handled yielding 401 Unauthorized
      expect([401, 400]).toContain(res.status);

      // Verify the payload is not returned unescaped in response
      const responseText = JSON.stringify(res.body);
      expect(responseText).not.toContain('<script>');
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
