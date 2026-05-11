import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

// Mock JWT_SECRET for test environment
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';

describe('Billing Branch Scoping (e2e)', () => {
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
      roles: ['billing.payment.create', 'billing.invoice.view'],
      ...(branchId && { branchId }),
    });
  };

  describe('POST /api/v1/billing/sessions/open', () => {
    it('should fail with 403 when branchId is missing from JWT', () => {
      const token = getValidToken();
      return request(app.getHttpServer())
        .post('/api/v1/billing/sessions/open')
        .set('Authorization', `Bearer ${token}`)
        .send({
          branchId: 'some-branch',
          openingBalance: 1000,
        })
        .expect(403);
    });

    it('should fail with 403 when DTO.branchId mismatches JWT branchId', () => {
      const token = getValidToken('branch-A');
      return request(app.getHttpServer())
        .post('/api/v1/billing/sessions/open')
        .set('Authorization', `Bearer ${token}`)
        .send({
          branchId: 'branch-B', // Mismatch
          openingBalance: 1000,
        })
        .expect(403);
    });
  });

  describe('GET /api/v1/billing/invoices', () => {
    it('should fail with 403 when branchId is missing from JWT', () => {
      const token = getValidToken();
      return request(app.getHttpServer())
        .get('/api/v1/billing/invoices')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/billing/payments', () => {
    it('should fail with 403 when branchId is missing from JWT', () => {
      const token = getValidToken();
      return request(app.getHttpServer())
        .post('/api/v1/billing/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          invoiceId: '00000000-0000-0000-0000-000000000000',
          cashierSessionId: '00000000-0000-0000-0000-000000000000',
          amount: 100,
          paymentMethod: 'CASH',
          idempotencyKey: 'key-123',
        })
        .expect(403);
    });
  });

  describe('PATCH /api/v1/billing/sessions/:id/close', () => {
    it('should fail with 403 when branchId is missing from JWT', () => {
      const token = getValidToken();
      return request(app.getHttpServer())
        .patch('/api/v1/billing/sessions/session-123/close')
        .set('Authorization', `Bearer ${token}`)
        .send({ actualClosingBalance: 100 })
        .expect(403);
    });

    it('should fail with 403 when DTO.branchId mismatches JWT branchId', () => {
      const token = getValidToken('branch-A');
      return request(app.getHttpServer())
        .patch('/api/v1/billing/sessions/session-123/close')
        .set('Authorization', `Bearer ${token}`)
        .send({
          branchId: 'branch-B',
          actualClosingBalance: 100,
        })
        .expect(403);
    });
  });

  describe('GET /api/v1/billing/sessions/active', () => {
    it('should fail with 403 when branchId is missing from JWT', () => {
      const token = getValidToken();
      return request(app.getHttpServer())
        .get('/api/v1/billing/sessions/active')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
