import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { MarketplaceModule } from '../src/marketplace/marketplace.module';
import { AuditModule } from '../src/audit/audit.module';
import { randomUUID } from 'crypto';

describe('Marketplace Supplier Isolation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const supplierA_Id = randomUUID();
  const supplierB_Id = randomUUID();
  const userA_Id = randomUUID();

  let listingA_Id: string;
  let listingB_Id: string;
  let categoryId: string;
  let serviceItemId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        AuditModule,
        MarketplaceModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Setup basic data
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: { id: tenantId, name: 'Test Tenant', status: 'ACTIVE' },
    });

    // Create a real User for Supplier A to satisfy AuditLog FK
    await prisma.user.create({
      data: {
        id: userA_Id,
        tenantId,
        email: `a-${randomUUID().substring(0, 8)}@supplier.com`,
        passwordHash: 'fake',
      },
    });

    categoryId = randomUUID();
    await prisma.serviceCategory.create({
      data: {
        id: categoryId,
        tenantId,
        name: 'Equipment',
        createdBy: userA_Id,
        updatedBy: userA_Id,
      },
    });

    serviceItemId = randomUUID();
    await prisma.serviceItem.create({
      data: {
        id: serviceItemId,
        tenantId,
        categoryId,
        code: `ITEM-${randomUUID().substring(0, 8)}`,
        name: 'MRI Scanner',
        createdBy: userA_Id,
        updatedBy: userA_Id,
      },
    });

    await prisma.supplier.create({
      data: {
        id: supplierA_Id,
        tenantId,
        name: 'Supplier A',
        status: 'ACTIVE',
      },
    });

    // Link user to supplier
    await prisma.user.update({
      where: { id: userA_Id },
      data: { supplierId: supplierA_Id },
    });

    await prisma.supplier.create({
      data: {
        id: supplierB_Id,
        tenantId,
        name: 'Supplier B',
        status: 'ACTIVE',
      },
    });

    // Create a listing for Supplier B
    listingB_Id = randomUUID();
    await prisma.marketplaceListing.create({
      data: {
        id: listingB_Id,
        tenantId,
        supplierId: supplierB_Id,
        serviceItemId,
        status: 'APPROVED',
      },
    });
  });

  it('Supplier A should only see their own listings', async () => {
    MockJwtAuthGuard.user = {
      userId: userA_Id,
      tenantId,
      supplierId: supplierA_Id,
      roles: ['Supplier'],
      email: 'a@supplier.com',
    } as any;

    // First, verify Supplier A has no listings
    const res1 = await request(app.getHttpServer())
      .get('/marketplace/supplier/listings')
      .expect(200);
    expect(res1.body).toHaveLength(0);

    // Supplier A creates a listing
    const res2 = await request(app.getHttpServer())
      .post('/marketplace/supplier/listings')
      .send({
        serviceItemId,
        description: 'New MRI from Supplier A',
      })
      .expect(201);
    listingA_Id = res2.body.id;

    // Verify Supplier A now has 1 listing
    const res3 = await request(app.getHttpServer())
      .get('/marketplace/supplier/listings')
      .expect(200);
    expect(res3.body).toHaveLength(1);
    expect(res3.body[0].id).toBe(listingA_Id);
  });

  it('Supplier A should not be able to update Supplier B listing', async () => {
    MockJwtAuthGuard.user = {
      userId: userA_Id,
      tenantId,
      supplierId: supplierA_Id,
      roles: ['Supplier'],
      email: 'a@supplier.com',
    } as any;

    await request(app.getHttpServer())
      .patch(`/marketplace/supplier/listings/${listingB_Id}`)
      .send({ description: 'Hacked by A' })
      .expect(403);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
