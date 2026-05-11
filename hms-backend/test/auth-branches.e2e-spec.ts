process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        userBranch: {
          deleteMany: jest.fn(),
          createMany: jest.fn(),
          findMany: jest.fn(),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    jwtService = app.get(JwtService);
    prisma = app.get(PrismaService);
  });

  describe('GET /api/v1/auth/branches', () => {
    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/branches')
        .expect(401);
    });

    it('should return active branch assignments only for the authenticated tenant user', async () => {
      const tenantId = '00000000-0000-0000-0000-000000000001';
      const userId = '00000000-0000-0000-0000-000000000001';
      const branchId1 = '00000000-0000-0000-0000-000000000010';

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const mockDeleteMany = prisma.userBranch.deleteMany as jest.Mock;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const mockCreateMany = prisma.userBranch.createMany as jest.Mock;
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const mockFindMany = prisma.userBranch.findMany as jest.Mock;

      mockDeleteMany.mockResolvedValue({ count: 1 });
      mockCreateMany.mockResolvedValue({ count: 3 });
      mockFindMany.mockResolvedValue([
        {
          branch: {
            id: branchId1,
            name: 'Branch 1',
            code: 'B1',
          },
        },
      ]);

      const token = jwtService.sign({ sub: userId, tenantId });

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/branches')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(branchId1);
      expect(response.body[0]).not.toHaveProperty('tenantId');
    });

    it('should return empty array when no active assignments exist', async () => {
      const userId = '00000000-0000-0000-0000-000000000002';
      const token = jwtService.sign({
        sub: userId,
        tenantId: '00000000-0000-0000-0000-000000000001',
      });

      (prisma.userBranch.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/branches')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
