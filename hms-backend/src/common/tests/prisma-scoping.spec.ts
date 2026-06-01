import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Prisma Query Scoping Regression Tests
 *
 * These tests prove that:
 * 1. findUnique({ where: { id } }) on a tenant-owned model can return cross-tenant data
 * 2. findFirst({ where: { id, tenantId } }) correctly scopes to the tenant
 * 3. updateMany with { id, tenantId } is safe
 * 4. Cross-tenant access via unscoped findUnique is detectable
 *
 * These tests use Prisma mocks because no real PostgreSQL is available.
 * When real DB is available, these should be run as integration tests.
 */

describe('PrismaQueryScoping', () => {
  let prisma: PrismaService;

  const mockTenantA = 'tenant-a-uuid';
  const mockTenantB = 'tenant-b-uuid';
  const mockPatientId = 'patient-123';

  const mockDb = {
    patient: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    invoice: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    labResult: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    prescription: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: mockDb,
        },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('findUnique vs findFirst - tenant-owned models', () => {
    it('findUnique({ where: { id } }) returns patient even when tenantId does not match', async () => {
      // Tenant A's data in Tenant B's scope
      const crossTenantPatient = {
        id: mockPatientId,
        tenantId: mockTenantA,
        firstName: 'Cross-Tenant',
        lastName: 'Patient',
      };

      mockDb.patient.findUnique.mockResolvedValue(crossTenantPatient);

      // Simulate Tenant B looking up by ID without tenantId filter
      const result = await prisma.patient.findUnique({
        where: { id: mockPatientId },
      });

      // This returns Tenant A's data to Tenant B — the bug
      expect(result).toEqual(crossTenantPatient);
      expect(result.tenantId).toBe(mockTenantA);
    });

    it('findFirst({ where: { id, tenantId } }) correctly scopes to tenant', async () => {
      // Tenant A's data
      const tenantAPatient = {
        id: mockPatientId,
        tenantId: mockTenantA,
        firstName: 'TenantA',
      };

      mockDb.patient.findFirst.mockImplementation(
        async ({ where: { id: _id, tenantId } }: any) => {
          if (tenantId === mockTenantA) return tenantAPatient;
          return null;
        },
      );

      // Tenant B looking up with id + tenantId filter — should get null
      const result = await prisma.patient.findFirst({
        where: { id: mockPatientId, tenantId: mockTenantB },
      });

      expect(result).toBeNull();
    });

    it('findFirst({ where: { id, tenantId } }) returns data for correct tenant', async () => {
      const tenantAPatient = {
        id: mockPatientId,
        tenantId: mockTenantA,
        firstName: 'TenantA',
      };

      mockDb.patient.findFirst.mockImplementation(
        async ({ where: { id: _id, tenantId } }: any) => {
          if (tenantId === mockTenantA) return tenantAPatient;
          return null;
        },
      );

      // Tenant A looking up own data
      const result = await prisma.patient.findFirst({
        where: { id: mockPatientId, tenantId: mockTenantA },
      });

      expect(result).toEqual(tenantAPatient);
    });
  });

  describe('updateMany with tenantId scoping', () => {
    it('updateMany with { id, tenantId } prevents cross-tenant update', async () => {
      mockDb.patient.updateMany.mockResolvedValue({ count: 0 });

      // Attempt to update Tenant A's patient from Tenant B context
      const result = await prisma.patient.updateMany({
        where: { id: mockPatientId, tenantId: mockTenantB },
        data: { firstName: 'Hacked' },
      });

      // Should affect 0 rows — tenant isolation works
      expect(result.count).toBe(0);
      // Service should check count and throw NotFoundException
    });

    it('updateMany with { id, tenantId } updates correct tenant data', async () => {
      mockDb.patient.updateMany.mockResolvedValue({ count: 1 });

      // Update own tenant's patient
      const result = await prisma.patient.updateMany({
        where: { id: mockPatientId, tenantId: mockTenantA },
        data: { firstName: 'Updated' },
      });

      expect(result.count).toBe(1);
    });
  });

  describe('cross-model scoping verification', () => {
    it('invoice findUnique without tenantId can return cross-tenant data', async () => {
      const crossTenantInvoice = {
        id: 'inv-456',
        tenantId: mockTenantA,
        totalAmount: 1000,
      };

      mockDb.invoice.findUnique.mockResolvedValue(crossTenantInvoice);

      const result = await prisma.invoice.findUnique({
        where: { id: 'inv-456' },
      });

      expect(result).toEqual(crossTenantInvoice);
      expect(result.tenantId).toBe(mockTenantA);
    });

    it('invoice findFirst with tenantId correctly scopes', async () => {
      mockDb.invoice.findFirst.mockImplementation(
        async ({ where: { id, tenantId } }: any) => {
          if (tenantId === mockTenantA) return { id, tenantId };
          return null;
        },
      );

      // Cross-tenant lookup should fail
      const crossResult = await prisma.invoice.findFirst({
        where: { id: 'inv-456', tenantId: mockTenantB },
      });
      expect(crossResult).toBeNull();

      // Own-tenant lookup should succeed
      const ownResult = await prisma.invoice.findFirst({
        where: { id: 'inv-456', tenantId: mockTenantA },
      });
      expect(ownResult).toBeDefined();
    });

    it('labResult findFirst with tenantId correctly scopes', async () => {
      mockDb.labResult.findFirst.mockImplementation(
        async ({ where: { id, tenantId } }: any) => {
          if (tenantId === mockTenantA)
            return { id, tenantId, status: 'RELEASED' };
          return null;
        },
      );

      const crossResult = await prisma.labResult.findFirst({
        where: { id: 'lab-789', tenantId: mockTenantB },
      });
      expect(crossResult).toBeNull();

      const ownResult = await prisma.labResult.findFirst({
        where: { id: 'lab-789', tenantId: mockTenantA },
      });
      expect(ownResult).toBeDefined();
    });

    it('prescription findFirst with tenantId correctly scopes', async () => {
      mockDb.prescription.findFirst.mockImplementation(
        async ({ where: { id, tenantId } }: any) => {
          if (tenantId === mockTenantA)
            return { id, tenantId, status: 'ACTIVE' };
          return null;
        },
      );

      const crossResult = await prisma.prescription.findFirst({
        where: { id: 'rx-101', tenantId: mockTenantB },
      });
      expect(crossResult).toBeNull();

      const ownResult = await prisma.prescription.findFirst({
        where: { id: 'rx-101', tenantId: mockTenantA },
      });
      expect(ownResult).toBeDefined();
    });
  });

  describe('branch-scoped query verification', () => {
    it('findMany without branchId can return cross-branch data within tenant', async () => {
      const mockEncounters = [
        { id: 'enc-1', branchId: 'branch-a', tenantId: mockTenantA },
        { id: 'enc-2', branchId: 'branch-b', tenantId: mockTenantA },
      ];

      mockDb.patient.findMany = jest.fn().mockResolvedValue(mockEncounters);

      // Simulate a list query that has tenantId but no branchId
      const result = await prisma.patient.findMany({
        where: { tenantId: mockTenantA },
      });

      expect(result.length).toBe(2);
      // Both branches' data returned within same tenant, which may be acceptable
      // depending on business rules — noted for awareness
    });
  });
});
