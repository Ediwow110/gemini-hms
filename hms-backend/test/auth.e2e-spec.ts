import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

// Mock JWT_SECRET for test environment
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';

describe('Auth Selection (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = app.get(JwtService);
  });

  describe('POST /api/v1/auth/select-branch', () => {
    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/select-branch')
        .send({ branchId: '00000000-0000-0000-0000-000000000000' })
        .expect(401);
    });

    it('should reject missing branchId', async () => {
      const token = jwtService.sign({ sub: 'u1', tenantId: 't1', roles: [] });
      return request(app.getHttpServer())
        .post('/api/v1/auth/select-branch')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });

    it('should reject invalid UUID branchId', async () => {
      const token = jwtService.sign({ sub: 'u1', tenantId: 't1', roles: [] });
      return request(app.getHttpServer())
        .post('/api/v1/auth/select-branch')
        .set('Authorization', `Bearer ${token}`)
        .send({ branchId: 'not-a-uuid' })
        .expect(400);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
