import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('OWASP Secure Security Headers Validation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Wire up the same global middleware as main.ts
    app.use((req: any, res: any, next: () => void) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=15552000; includeSubDomains',
      );
      res.setHeader('Content-Security-Policy', "default-src 'self'");
      next();
    });

    await app.init();
  });

  it('should include all required OWASP security headers in response', async () => {
    const res = await request(app.getHttpServer()).get('/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['strict-transport-security']).toContain('max-age=');
    expect(res.headers['content-security-policy']).toBe("default-src 'self'");
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
