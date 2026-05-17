import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: any;

  const mockTenantId = 'tenant-uuid';
  const mockBranchId = 'branch-uuid';
  const mockUserId = 'user-uuid';

  beforeEach(async () => {
    prisma = {
      auditLog: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('findAll', () => {
    it('should enforce tenant scope', async () => {
      prisma.auditLog.count.mockResolvedValue(0);
      prisma.auditLog.findMany.mockResolvedValue([]);

      await service.findAll(mockTenantId, mockBranchId, ['Branch Admin'], {});

      expect(prisma.auditLog.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: mockTenantId }),
        }),
      );
    });

    it('should enforce branch scope for branch users', async () => {
      prisma.auditLog.count.mockResolvedValue(0);
      prisma.auditLog.findMany.mockResolvedValue([]);

      await service.findAll(mockTenantId, mockBranchId, ['Branch Admin'], {});

      expect(prisma.auditLog.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ branchId: mockBranchId }),
        }),
      );
    });

    it('should allow Super Admin to see all logs', async () => {
      prisma.auditLog.count.mockResolvedValue(0);
      prisma.auditLog.findMany.mockResolvedValue([]);

      await service.findAll(mockTenantId, mockBranchId, ['Super Admin'], {});

      expect(prisma.auditLog.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: mockTenantId },
        }),
      );
    });

    it('should cap pageSize at 100', async () => {
      prisma.auditLog.count.mockResolvedValue(10);
      prisma.auditLog.findMany.mockResolvedValue([]);

      await service.findAll(mockTenantId, mockBranchId, ['Super Admin'], {
        pageSize: 500,
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException for wrong tenant', async () => {
      prisma.auditLog.findUnique.mockResolvedValue({
        tenantId: 'other-tenant',
      });

      await expect(
        service.findOne(mockTenantId, mockBranchId, ['Super Admin'], 'log-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for out-of-scope branch', async () => {
      prisma.auditLog.findUnique.mockResolvedValue({
        tenantId: mockTenantId,
        branchId: 'other-branch',
      });

      await expect(
        service.findOne(mockTenantId, mockBranchId, ['Branch Admin'], 'log-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return sanitized data for non-admin', async () => {
      prisma.auditLog.findUnique.mockResolvedValue({
        id: 'log-id',
        tenantId: mockTenantId,
        branchId: mockBranchId,
        oldValues: { foo: 'bar' },
        newValues: { foo: 'baz' },
      });

      const result = await service.findOne(
        mockTenantId,
        mockBranchId,
        ['Branch Admin'],
        'log-id',
      );

      expect(result).not.toHaveProperty('oldValues');
      expect(result).not.toHaveProperty('newValues');
    });
  });

  describe('log', () => {
    it('should include branchId when provided', async () => {
      prisma.auditLog.create.mockResolvedValue({});
      const data = {
        tenantId: mockTenantId,
        userId: mockUserId,
        eventKey: 'TEST_EVENT',
        recordType: 'Payment',
        recordId: 'rec-uuid',
      };

      await service.log(data, undefined, mockBranchId);

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ branchId: mockBranchId }),
        }),
      );
    });
  });
});
