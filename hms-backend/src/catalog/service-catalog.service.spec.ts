import { Test, TestingModule } from '@nestjs/testing';
import { ServiceCatalogService } from './service-catalog.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ServiceStatus } from './dto/service-catalog.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ServiceCatalogService', () => {
  let service: ServiceCatalogService;
  let prisma: any;
  let audit: any;

  const mockTenantId = 'tenant-uuid';
  const mockUserId = 'user-uuid';

  const createPrismaMock = () => {
    const mock: any = {
      serviceCatalog: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => await cb(mock)),
    };
    return mock;
  };

  beforeEach(async () => {
    prisma = createPrismaMock();
    audit = { log: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceCatalogService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<ServiceCatalogService>(ServiceCatalogService);
  });

  describe('create', () => {
    const dto = {
      name: 'Consultation',
      code: 'CONS-001',
      category: 'GENERAL',
      price: 500,
    };

    it('should successfully create a service catalog item', async () => {
      prisma.serviceCatalog.findFirst.mockResolvedValue(null);
      prisma.serviceCatalog.create.mockResolvedValue({ id: 's1', ...dto });

      const result = await service.create(mockTenantId, mockUserId, dto);

      expect(result.id).toBe('s1');
      expect(prisma.serviceCatalog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: mockTenantId,
            code: 'CONS-001',
          }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'SERVICE_CATALOG_CREATED' }),
        expect.anything(),
      );
    });

    it('should throw ConflictException if code already exists', async () => {
      prisma.serviceCatalog.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create(mockTenantId, mockUserId, dto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all services for the tenant', async () => {
      prisma.serviceCatalog.findMany.mockResolvedValue([
        { id: 's1' },
        { id: 's2' },
      ]);
      const result = await service.findAll(mockTenantId);
      expect(result).toHaveLength(2);
      expect(prisma.serviceCatalog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: mockTenantId } }),
      );
    });

    it('should filter by status if provided', async () => {
      await service.findAll(mockTenantId, ServiceStatus.ACTIVE);
      expect(prisma.serviceCatalog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: mockTenantId, status: ServiceStatus.ACTIVE },
        }),
      );
    });
  });

  describe('update', () => {
    const existing = {
      id: 's1',
      tenantId: mockTenantId,
      status: ServiceStatus.ACTIVE,
    };
    const updateDto = { price: 600 };

    it('should successfully update a service catalog item', async () => {
      prisma.serviceCatalog.findFirst.mockResolvedValue(existing);
      prisma.serviceCatalog.update.mockResolvedValue({
        ...existing,
        ...updateDto,
      });

      const result = await service.update(
        mockTenantId,
        mockUserId,
        's1',
        updateDto,
      );

      expect(result.price).toBe(600);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'SERVICE_CATALOG_UPDATED',
          oldValues: existing,
        }),
        expect.anything(),
      );
    });

    it('should throw NotFoundException if item does not exist or wrong tenant', async () => {
      prisma.serviceCatalog.findFirst.mockResolvedValue(null);
      await expect(
        service.update(mockTenantId, mockUserId, 's1', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    const existing = {
      id: 's1',
      tenantId: mockTenantId,
      status: ServiceStatus.ACTIVE,
    };

    it('should set status to INACTIVE', async () => {
      prisma.serviceCatalog.findFirst.mockResolvedValue(existing);
      prisma.serviceCatalog.update.mockResolvedValue({
        ...existing,
        status: ServiceStatus.INACTIVE,
      });

      const result = await service.deactivate(mockTenantId, mockUserId, 's1');

      expect(result.status).toBe(ServiceStatus.INACTIVE);
      expect(prisma.serviceCatalog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: ServiceStatus.INACTIVE },
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'SERVICE_CATALOG_DEACTIVATED' }),
        expect.anything(),
      );
    });

    it('should return existing if already INACTIVE', async () => {
      const inactive = { ...existing, status: ServiceStatus.INACTIVE };
      prisma.serviceCatalog.findFirst.mockResolvedValue(inactive);

      const result = await service.deactivate(mockTenantId, mockUserId, 's1');

      expect(result).toEqual(inactive);
      expect(prisma.serviceCatalog.update).not.toHaveBeenCalled();
    });
  });
});
