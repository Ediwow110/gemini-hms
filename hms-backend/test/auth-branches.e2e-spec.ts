process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    jwtService = app.get(JwtService);
  });

  describe('GET /api/v1/auth/branches', () => {
    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/branches')
        .expect(401);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
