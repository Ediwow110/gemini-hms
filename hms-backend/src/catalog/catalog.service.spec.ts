import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('CatalogService', () => {
  let service: CatalogService;
  let prisma: any;
  let audit: any;

  const mockTenantId = 'tenant-uuid';
  const mockUserId = 'user-uuid';
  const mockBranchId = 'branch-uuid';

  beforeEach(async () => {
    prisma = {
      serviceCategory: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      serviceItem: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      servicePrice: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest
        .fn()
        .mockImplementation(async (cb) => await cb(prisma)),
    };

    audit = {
      log: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  describe('createCategory', () => {
    it('should create a category', async () => {
      const dto = { name: 'Lab', description: 'Lab tests' };
      prisma.serviceCategory.create.mockResolvedValue({ id: 'cat1', ...dto });

      const result = await service.createCategory(
        mockTenantId,
        mockUserId,
        dto,
      );

      expect(prisma.serviceCategory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: mockTenantId,
          name: 'Lab',
          createdBy: mockUserId,
        }),
      });
      expect(audit.log).toHaveBeenCalled();
      expect(result.id).toBe('cat1');
    });
  });

  describe('findAllCategories', () => {
    it('should list categories for tenant', async () => {
      prisma.serviceCategory.findMany.mockResolvedValue([
        { id: 'cat1', name: 'Lab' },
      ]);

      const result = await service.findAllCategories(mockTenantId, {});

      expect(prisma.serviceCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: mockTenantId }),
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('updateCategory', () => {
    it('should update a category', async () => {
      const id = 'cat1';
      const dto = { name: 'New Name' };
      prisma.serviceCategory.findFirst.mockResolvedValue({ id, name: 'Old' });
      prisma.serviceCategory.update.mockResolvedValue({ id, ...dto });

      const result = await service.updateCategory(
        mockTenantId,
        mockUserId,
        id,
        dto,
      );

      expect(prisma.serviceCategory.update).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'CATALOG_CATEGORY_UPDATED',
        }),
      );
      expect(result.name).toBe('New Name');
    });
  });

  describe('createItem', () => {
    it('should create an item', async () => {
      const dto = {
        categoryId: 'cat1',
        code: 'CBC',
        name: 'Complete Blood Count',
      };
      prisma.serviceCategory.findFirst.mockResolvedValue({ id: 'cat1' });
      prisma.serviceItem.findFirst.mockResolvedValue(null);
      prisma.serviceItem.create.mockResolvedValue({ id: 'item1', ...dto });

      const result = await service.createItem(mockTenantId, mockUserId, dto);

      expect(prisma.serviceItem.create).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalled();
      expect(result.id).toBe('item1');
    });

    it('should fail if code already exists', async () => {
      const dto = { categoryId: 'cat1', code: 'CBC', name: 'CBC' };
      prisma.serviceCategory.findFirst.mockResolvedValue({ id: 'cat1' });
      prisma.serviceItem.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createItem(mockTenantId, mockUserId, dto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateItem', () => {
    it('should update an item', async () => {
      const id = 'item1';
      const dto = { name: 'New Item Name' };
      prisma.serviceItem.findFirst.mockResolvedValue({
        id,
        name: 'Old',
        code: 'OLD',
      });
      prisma.serviceItem.update.mockResolvedValue({ id, ...dto });

      const result = await service.updateItem(
        mockTenantId,
        mockUserId,
        id,
        dto,
      );

      expect(prisma.serviceItem.update).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'CATALOG_ITEM_UPDATED',
        }),
      );
      expect(result.name).toBe('New Item Name');
    });
  });

  describe('setPrice', () => {
    it('should deactivate old price and create new one in transaction', async () => {
      const itemId = 'item1';
      const dto = { branchId: mockBranchId, amount: 500 };
      const oldPrice = { id: 'old-p', amount: 400, isActive: true };

      prisma.serviceItem.findFirst.mockResolvedValue({ id: itemId });
      prisma.servicePrice.findFirst.mockResolvedValue(oldPrice);
      prisma.servicePrice.create.mockResolvedValue({ id: 'new-p', ...dto });

      const result = await service.setPrice(
        mockTenantId,
        mockUserId,
        itemId,
        dto,
      );

      expect(prisma.servicePrice.update).toHaveBeenCalledWith({
        where: { id: 'old-p' },
        data: expect.objectContaining({ isActive: false }),
      });
      expect(prisma.servicePrice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 500,
          isActive: true,
        }),
      });
      expect(audit.log).toHaveBeenCalled();
      expect(result.id).toBe('new-p');
    });
  });

  describe('findAllItems', () => {
    it('should list items with search', async () => {
      const query = { search: 'CBC' };
      prisma.serviceItem.findMany.mockResolvedValue([]);

      await service.findAllItems(mockTenantId, query);

      expect(prisma.serviceItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockTenantId,
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it('should resolve branch price if branchId provided', async () => {
      const query = { branchId: mockBranchId };
      prisma.serviceItem.findMany.mockResolvedValue([
        {
          id: 'item1',
          name: 'CBC',
          prices: [{ amount: new Prisma.Decimal(150), branchId: mockBranchId }],
        },
      ]);

      const result = await service.findAllItems(mockTenantId, query);

      expect(result[0].currentPrice).toEqual(new Prisma.Decimal(150));
      expect(result[0].prices).toBeUndefined();
    });
  });
});
