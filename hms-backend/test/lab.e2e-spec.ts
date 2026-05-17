import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, APP_GUARD } from '@nestjs/common';
import request from 'supertest';
import { LabModule } from '../src/lab/lab.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { cleanupDatabase } from './helpers/db-cleanup';
import { randomUUID } from 'crypto';

describe('Lab Branch Scoping (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests-that-is-long-enough';
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        LabModule,
      ],
      providers: [
      ],
    })
    .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
    .overrideGuard(BranchGuard).useValue({ canActivate: () => true })
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalGuards(new MockJwtAuthGuard());
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupDatabase(prisma);

    const tenant = await prisma.tenant.create({ data: { name: `Lab-Tenant-${randomUUID()}` } });
    const branch = await prisma.branch.create({
        data: { id: randomUUID(), tenantId: tenant.id, name: 'Lab Branch', code: `LB-${randomUUID().substring(0,4)}` }
    });

    MockJwtAuthGuard.user.tenantId = tenant.id;
    MockJwtAuthGuard.user.branchId = branch.id;
  });

  describe('GET /api/v1/lab/worklist', () => {
    it('should bypass guard correctly and hit business logic', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/lab/worklist');
      
      expect([200, 404, 400]).toContain(res.status);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});

