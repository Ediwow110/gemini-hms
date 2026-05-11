import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { App } from 'supertest/types';

describe('Lab Branch Scoping (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

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

  const getValidToken = (branchId?: string) => {
    return jwtService.sign({
      sub: 'user-uuid',
      email: 'test@example.com',
      tenantId: 'tenant-uuid',
      roles: [
        'lab.result.view',
        'lab.result.encode',
        'lab.result.approve',
        'lab.result.release',
        'lab.result.amend',
      ],
      ...(branchId && { branchId }),
    });
  };

  describe('GET /api/v1/lab/worklist', () => {
    it('should fail with 403 when branchId is missing from JWT', () => {
      const token = getValidToken();
      return request(app.getHttpServer())
        .get('/api/v1/lab/worklist')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/lab/results/:id', () => {
    it('should fail with 403 when branchId is missing from JWT', () => {
      const token = getValidToken();
      return request(app.getHttpServer())
        .get('/api/v1/lab/results/any-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('PATCH /api/v1/lab/results/:id/encode', () => {
    it('should fail with 403 when branchId is missing from JWT', () => {
      const token = getValidToken();
      return request(app.getHttpServer())
        .patch('/api/v1/lab/results/any-id/encode')
        .set('Authorization', `Bearer ${token}`)
        .send({ results: 'data' })
        .expect(403);
    });
  });

  describe('PATCH /api/v1/lab/results/:id/approve', () => {
    it('should fail with 403 when branchId is missing from JWT', () => {
      const token = getValidToken();
      return request(app.getHttpServer())
        .patch('/api/v1/lab/results/any-id/approve')
        .set('Authorization', `Bearer ${token}`)
        .send({ pathologistRemarks: 'approved' })
        .expect(403);
    });
  });

  describe('POST /api/v1/lab/results/:id/release', () => {
    it('should fail with 403 when branchId is missing from JWT', () => {
      const token = getValidToken();
      return request(app.getHttpServer())
        .post('/api/v1/lab/results/any-id/release')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/lab/results/:id/amend', () => {
    it('should fail with 403 when branchId is missing from JWT', () => {
      const token = getValidToken();
      return request(app.getHttpServer())
        .post('/api/v1/lab/results/any-id/amend')
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'typo' })
        .expect(403);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
