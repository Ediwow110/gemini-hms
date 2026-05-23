import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PharmacyModule } from '../src/pharmacy/pharmacy.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { AuditModule } from '../src/audit/audit.module';
import { cleanupDatabase } from './helpers/db-cleanup';
import { randomUUID } from 'crypto';
import { PrescriptionStatus } from '@prisma/client';

describe('Pharmacy E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantId: string;
  let branchId: string;
  let patientId: string;
  let encounterId: string;
  let doctorId: string;
  let prescriptionId: string;
  let inventoryItemId: string;
  let prescriptionVersion: number;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    MockJwtAuthGuard.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId: '123e4567-e89b-12d3-a456-426614174000',
      branchId: '123e4567-e89b-12d3-a456-426614174001',
      roles: ['Pharmacist'],
      permissions: ['*'],
      email: 'pharmacist@hms.local',
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        AuditModule,
        PharmacyModule,
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BranchGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalGuards(new MockJwtAuthGuard());
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupDatabase(prisma);

    tenantId = '123e4567-e89b-12d3-a456-426614174000';
    branchId = '123e4567-e89b-12d3-a456-426614174001';
    doctorId = '11111111-1111-4111-8111-111111111111';

    patientId = randomUUID();
    encounterId = randomUUID();
    prescriptionId = randomUUID();
    inventoryItemId = randomUUID();

    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: { id: tenantId, name: 'Pharmacy Test Tenant' },
    });

    await prisma.branch.upsert({
      where: { id: branchId },
      update: {},
      create: {
        id: branchId,
        tenantId,
        name: 'Pharmacy Test Branch',
        code: 'PHARM-E2E',
      },
    });

    await prisma.inventoryItem.upsert({
      where: {
        tenantId_sku: { tenantId, sku: 'DRG-AMOX-E2E' },
      },
      update: { currentStock: 100 },
      create: {
        id: inventoryItemId,
        tenantId,
        name: 'Test Drug Amoxicillin',
        sku: 'DRG-AMOX-E2E',
        category: 'DRUG',
        unit: 'capsule',
        price: 5.0,
        reorderLevel: 10,
        currentStock: 100,
        status: 'ACTIVE',
      },
    });

    const existingStock = await prisma.branchStock.findFirst({
      where: { tenantId, branchId, inventoryItemId },
    });
    if (!existingStock) {
      await prisma.branchStock.create({
        data: {
          tenantId,
          branchId,
          inventoryItemId,
          quantity: 100,
          reorderLevel: 10,
        },
      });
    } else {
      await prisma.branchStock.update({
        where: { id: existingStock.id },
        data: { quantity: 100 },
      });
    }

    const doctor = await prisma.user.upsert({
      where: { id: doctorId },
      update: {},
      create: {
        id: doctorId,
        email: 'doctor-pharmacy@hms.local',
        passwordHash: 'fakehash',
        tenantId,
        status: 'ACTIVE',
      },
    });

    await prisma.patient.create({
      data: {
        id: patientId,
        tenantId,
        firstName: 'Pharmacy',
        lastName: 'Patient',
        patientNumber: 'PHM-001',
        dob: new Date('1990-01-01'),
      },
    });

    await prisma.encounter.create({
      data: {
        id: encounterId,
        tenantId,
        branchId,
        patientId,
        status: 'OPEN',
        createdBy: doctorId,
        updatedBy: doctorId,
      },
    });

    const createdPrescription = await prisma.prescription.create({
      data: {
        id: prescriptionId,
        tenantId,
        branchId,
        encounterId,
        prescribedById: doctor.id,
        patientId,
        medicationName: 'Amoxicillin 500mg',
        dosage: '1 capsule',
        frequency: 'Three times daily',
        duration: '7 days',
        status: PrescriptionStatus.ACTIVE,
      },
    });

    prescriptionVersion = createdPrescription.version;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Pharmacy Queue Access', () => {
    it('should return the prescription queue for pharmacist role', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/pharmacy/prescriptions')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((p: any) => p.id === prescriptionId);
      expect(found).toBeDefined();
      expect(found.medicationName).toBe('Amoxicillin 500mg');
      expect(found.status).toBe('ACTIVE');
      expect(found.isReadOnly).toBe(true);
    });

    it('should filter queue by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/pharmacy/prescriptions?status=ACTIVE')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((p: any) => p.status === 'ACTIVE')).toBe(true);
    });

    it('should return empty array for non-matching status filter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/pharmacy/prescriptions?status=DISPENSED')
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('Drug Catalog Access', () => {
    it('should return drug catalog with inventory items', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/pharmacy/drugs')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const drug = res.body.find((d: any) => d.id === inventoryItemId);
      expect(drug).toBeDefined();
      expect(drug.name).toBe('Test Drug Amoxicillin');
      expect(drug.type).toBe('DRUG');
      expect(drug.quantity).toBe(100);
    });
  });

  describe('Dispense Medication', () => {
    it('should dispense an active prescription successfully', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/pharmacy/prescriptions/${prescriptionId}/dispense`)
        .send({
          inventoryItemId,
          quantity: 5,
          version: prescriptionVersion,
        })
        .expect(201);

      expect(res.body.id).toBe(prescriptionId);
      expect(res.body.status).toBe('DISPENSED');
      expect(res.body.dispensedById).toBe(MockJwtAuthGuard.user.userId);
      expect(res.body.dispensedAt).toBeDefined();
      expect(res.body.version).toBe(prescriptionVersion + 1);
      expect(res.body.isReadOnly).toBe(true);

      prescriptionVersion = res.body.version;
    });

    it('should reject dispense for already dispensed prescription', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/pharmacy/prescriptions/${prescriptionId}/dispense`)
        .send({
          inventoryItemId,
          quantity: 5,
          version: prescriptionVersion,
        })
        .expect(409);

      expect(res.body.message).toContain('prescription_status_invalid');
    });

    it('should reject dispense with stale version', async () => {
      const oldId = randomUUID();
      await prisma.prescription.create({
        data: {
          id: oldId,
          tenantId,
          branchId,
          encounterId,
          prescribedById: doctorId,
          patientId,
          medicationName: 'Ibuprofen 400mg',
          dosage: '1 tablet',
          frequency: 'As needed',
          duration: '5 days',
          status: PrescriptionStatus.ACTIVE,
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/pharmacy/prescriptions/${oldId}/dispense`)
        .send({
          inventoryItemId,
          quantity: 5,
          version: 999,
        })
        .expect(409);

      expect(res.body.message).toContain('version_conflict');
    });

    it('should reject dispense for non-existent prescription', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/pharmacy/prescriptions/${randomUUID()}/dispense`)
        .send({
          inventoryItemId,
          quantity: 5,
          version: 0,
        })
        .expect(404);

      expect(res.body.message).toContain('prescription_not_found');
    });

    it('should reject dispense with insufficient stock', async () => {
      const lowStockId = randomUUID();
      const lowStockItemId = randomUUID();
      const lowStockSku = `DRG-LOW-${randomUUID().substring(0, 6)}`;
      await prisma.inventoryItem.create({
        data: {
          id: lowStockItemId,
          tenantId,
          name: 'Low Stock Drug',
          sku: lowStockSku,
          category: 'DRUG',
          unit: 'tablet',
          price: 2.0,
          reorderLevel: 10,
          currentStock: 1,
          status: 'ACTIVE',
        },
      });
      await prisma.branchStock.create({
        data: {
          tenantId,
          branchId,
          inventoryItemId: lowStockItemId,
          quantity: 1,
          reorderLevel: 10,
        },
      });

      await prisma.prescription.create({
        data: {
          id: lowStockId,
          tenantId,
          branchId,
          encounterId,
          prescribedById: doctorId,
          patientId,
          medicationName: 'Low Stock Med',
          dosage: '1 tablet',
          frequency: 'Daily',
          duration: '30 days',
          status: PrescriptionStatus.ACTIVE,
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/pharmacy/prescriptions/${lowStockId}/dispense`)
        .send({
          inventoryItemId: lowStockItemId,
          quantity: 10,
          version: 0,
        })
        .expect(400);

      expect(res.body.message).toContain('insufficient_stock');
    });
  });
});
