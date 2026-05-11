import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

// Mock JWT_SECRET for test environment
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';

describe('Orders Branch Scoping (e2e)', () => {
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
      roles: ['order.create', 'order.view'], // Must match permission strings in code if enforced
      ...(branchId && { branchId }),
    });
  };

  describe('POST /api/v1/orders', () => {
    it('should fail with 403 when branchId is missing from JWT', () => {
      const token = getValidToken();
      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          patientId: 'patient-uuid',
          branchId: 'branch-uuid',
          items: [{ name: 'Test', price: 100, quantity: 1 }],
        })
        .expect(403);
    });

    it('should fail with 403 when DTO.branchId mismatches JWT branchId', () => {
      const token = getValidToken('branch-A');
      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          patientId: 'patient-uuid',
          branchId: 'branch-B', // Mismatch
          items: [{ name: 'Test', price: 100, quantity: 1 }],
        })
        .expect(403);
    });
  });

  describe('GET /api/v1/orders', () => {
    it('should fail with 403 when branchId is missing from JWT', () => {
      const token = getValidToken();
      return request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
