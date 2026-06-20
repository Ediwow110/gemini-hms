import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { RequestUser } from '../common/types/authenticated-request.type';

describe('ProcurementService', () => {
  let service: ProcurementService;
  let prisma: PrismaService;

  const mockTenantId = '00000000-0000-0000-0000-000000000001';
  const mockOtherTenantId = '00000000-0000-0000-0000-000000000002';
  const mockBranchId = '00000000-0000-0000-0000-000000000010';
  const mockOtherBranchId = '00000000-0000-0000-0000-000000000020';

  const superAdminUser: RequestUser = {
    tenantId: mockTenantId,
    roles: ['Super Admin'],
  };

  const branchAdminUser: RequestUser = {
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Branch Admin'],
  };

  const otherBranchAdminUser: RequestUser = {
    tenantId: mockTenantId,
    branchId: mockOtherBranchId,
    roles: ['Branch Admin'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcurementService,
        {
          provide: PrismaService,
          useValue: {
            supplier: {
              findMany: jest.fn(),
            },
            purchaseRequest: {
              findMany: jest.fn(),
            },
            purchaseOrder: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: NumberingService,
          useValue: {
            generateNumber: jest.fn().mockResolvedValue('PO-00001'),
          },
        },
      ],
    }).compile();

    service = module.get<ProcurementService>(ProcurementService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listSuppliers', () => {
    it('should always scope by tenantId from authenticated user', async () => {
      (prisma.supplier.findMany as jest.Mock).mockResolvedValue([]);

      await service.listSuppliers(superAdminUser);

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: mockTenantId }),
        }),
      );
    });

    it('should not honor tenantId from query/options — only from user.tenantId', async () => {
      (prisma.supplier.findMany as jest.Mock).mockResolvedValue([]);

      const crossTenantUser: RequestUser = {
        tenantId: mockOtherTenantId,
        roles: ['Branch Admin'],
        branchId: mockBranchId,
      };
      await service.listSuppliers(crossTenantUser);

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: mockOtherTenantId }),
        }),
      );
    });

    it('should apply search filter (case-insensitive) when provided', async () => {
      (prisma.supplier.findMany as jest.Mock).mockResolvedValue([]);

      await service.listSuppliers(superAdminUser, { search: 'Acme' });

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockTenantId,
            name: { contains: 'Acme', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should apply status filter when provided', async () => {
      (prisma.supplier.findMany as jest.Mock).mockResolvedValue([]);

      await service.listSuppliers(superAdminUser, { status: 'INACTIVE' });

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockTenantId,
            status: 'INACTIVE',
          }),
        }),
      );
    });

    it('should return supplier rows in the order Prisma returns them', async () => {
      (prisma.supplier.findMany as jest.Mock).mockResolvedValue([
        { id: 'sup-1', name: 'Acme' },
        { id: 'sup-2', name: 'Beta' },
      ]);

      const result = await service.listSuppliers(superAdminUser);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('sup-1');
    });
  });

  describe('listPurchaseRequests', () => {
    it('should return tenant-wide for Super Admin', async () => {
      (prisma.purchaseRequest.findMany as jest.Mock).mockResolvedValue([
        { id: 'pr-1' },
      ]);

      const result = await service.listPurchaseRequests(superAdminUser);

      expect(prisma.purchaseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: mockTenantId },
        }),
      );
      expect(result.length).toBe(1);
    });

    it('should auto-scope Branch Admin to own branch when no branchId provided', async () => {
      (prisma.purchaseRequest.findMany as jest.Mock).mockResolvedValue([]);

      await service.listPurchaseRequests(branchAdminUser);

      expect(prisma.purchaseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockTenantId,
            branchId: mockBranchId,
          }),
        }),
      );
    });

    it('should allow Super Admin to filter by another branch', async () => {
      (prisma.purchaseRequest.findMany as jest.Mock).mockResolvedValue([]);

      await service.listPurchaseRequests(superAdminUser, {
        branchId: mockOtherBranchId,
      });

      expect(prisma.purchaseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ branchId: mockOtherBranchId }),
        }),
      );
    });

    it('should reject Branch Admin querying a different branch', async () => {
      await expect(
        service.listPurchaseRequests(branchAdminUser, {
          branchId: mockOtherBranchId,
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.purchaseRequest.findMany).not.toHaveBeenCalled();
    });

    it('should pass status filter when provided', async () => {
      (prisma.purchaseRequest.findMany as jest.Mock).mockResolvedValue([]);

      await service.listPurchaseRequests(superAdminUser, {
        status: 'APPROVED',
      });

      expect(prisma.purchaseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'APPROVED' }),
        }),
      );
    });
  });

  describe('listPurchaseOrders', () => {
    it('should return tenant-wide for Super Admin with supplier+PR relations', async () => {
      (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'po-1',
          supplier: { id: 'sup-1' },
          purchaseRequest: { id: 'pr-1' },
        },
      ]);

      const result = await service.listPurchaseOrders(superAdminUser);

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: mockTenantId },
          include: expect.objectContaining({
            supplier: expect.any(Object),
            purchaseRequest: expect.any(Object),
          }),
        }),
      );
      expect(result.length).toBe(1);
      expect(result[0].supplier.id).toBe('sup-1');
    });

    it('should auto-scope Branch Admin to own branch', async () => {
      (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue([]);

      await service.listPurchaseOrders(branchAdminUser);

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockTenantId,
            branchId: mockBranchId,
          }),
        }),
      );
    });

    it('should reject Branch Admin querying a different branch', async () => {
      await expect(
        service.listPurchaseOrders(branchAdminUser, {
          branchId: mockOtherBranchId,
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.purchaseOrder.findMany).not.toHaveBeenCalled();
    });

    it('should pass status filter when provided', async () => {
      (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue([]);

      await service.listPurchaseOrders(superAdminUser, { status: 'SENT' });

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'SENT' }),
        }),
      );
    });

    it('should always derive tenantId from authenticated user, never from filters', async () => {
      (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue([]);

      const crossTenantUser: RequestUser = {
        tenantId: mockOtherTenantId,
        roles: ['Branch Admin'],
        branchId: mockBranchId,
      };
      await service.listPurchaseOrders(crossTenantUser);

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: mockOtherTenantId }),
        }),
      );
    });
  });
});
