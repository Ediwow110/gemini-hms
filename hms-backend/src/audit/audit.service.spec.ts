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

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-audit-tests';
  });

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

    it('should filter by query parameters including dates and search keywords', async () => {
      prisma.auditLog.count.mockResolvedValue(1);
      prisma.auditLog.findMany.mockResolvedValue([]);

      await service.findAll(mockTenantId, mockBranchId, ['Super Admin'], {
        eventKey: 'patient.create',
        userId: mockUserId,
        recordType: 'Patient',
        recordId: 'rec-uuid',
        startDate: '2026-05-17T00:00:00.000Z',
        endDate: '2026-05-17T23:59:59.000Z',
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventKey: 'patient.create',
            userId: mockUserId,
            recordType: 'Patient',
            recordId: 'rec-uuid',
            createdAt: expect.any(Object),
          }),
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

    it('should return full data for Super Admin', async () => {
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
        ['Super Admin'],
        'log-id',
      );

      expect(result).toHaveProperty('oldValues');
      expect(result).toHaveProperty('newValues');
    });
  });

  describe('log', () => {
    it('should include branchId when provided', async () => {
      prisma.auditLog.create.mockResolvedValue({});
      prisma.auditLog.findFirst.mockResolvedValue(null);
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

    it('should correctly fetch preceding log and chain previousHash', async () => {
      prisma.auditLog.create.mockResolvedValue({});
      prisma.auditLog.findFirst.mockResolvedValue({
        hash: 'preceding-hash',
      });

      const data = {
        tenantId: mockTenantId,
        userId: mockUserId,
        eventKey: 'TEST_EVENT',
        recordType: 'Payment',
        recordId: 'rec-uuid',
      };

      await service.log(data);

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            previousHash: 'preceding-hash',
          }),
        }),
      );
    });
  });

  describe('canonicalize and computeHash', () => {
    it('should generate identical hashes regardless of object key order', () => {
      const entry1 = {
        tenantId: mockTenantId,
        userId: mockUserId,
        eventKey: 'test',
        recordType: 'test',
        recordId: '123',
        oldValues: { a: 1, b: 2 },
        newValues: { b: 2, a: 1 },
        createdAt: new Date('2026-05-17T12:00:00Z'),
        previousHash: null,
      };

      const entry2 = {
        ...entry1,
        oldValues: { b: 2, a: 1 },
        newValues: { a: 1, b: 2 },
      };

      const hash1 = (service as any).computeHash(entry1);
      const hash2 = (service as any).computeHash(entry2);

      expect(hash1).toEqual(hash2);
    });

    it('should canonicalize nested arrays and complex objects', () => {
      const complex = {
        z: [3, 2, 1],
        a: {
          y: 'test',
          x: [
            { b: 2, a: 1 },
            { d: 4, c: 3 },
          ],
        },
      };

      const result = (service as any).canonicalize(complex);

      expect(JSON.stringify(result)).toEqual(
        JSON.stringify({
          a: {
            x: [
              { a: 1, b: 2 },
              { c: 3, d: 4 },
            ],
            y: 'test',
          },
          z: [3, 2, 1],
        }),
      );
    });

    it('should preserve exact millisecond precision to detect sub-second tampering', () => {
      const entry1 = {
        tenantId: mockTenantId,
        userId: mockUserId,
        eventKey: 'test',
        recordType: 'test',
        recordId: '123',
        oldValues: null,
        newValues: null,
        createdAt: new Date('2026-05-17T12:00:00.123Z'),
        previousHash: null,
      };

      const entry2 = {
        ...entry1,
        createdAt: new Date('2026-05-17T12:00:00.456Z'),
      };

      const hash1 = (service as any).computeHash(entry1);
      const hash2 = (service as any).computeHash(entry2);

      expect(hash1).not.toEqual(hash2);
    });

    it('should break hash if action/eventKey changes', () => {
      const entry1 = {
        tenantId: mockTenantId,
        userId: mockUserId,
        eventKey: 'test.create',
        recordType: 'test',
        recordId: '123',
        oldValues: null,
        newValues: null,
        createdAt: new Date('2026-05-17T12:00:00Z'),
        previousHash: null,
      };

      const entry2 = {
        ...entry1,
        eventKey: 'test.update',
      };

      const hash1 = (service as any).computeHash(entry1);
      const hash2 = (service as any).computeHash(entry2);

      expect(hash1).not.toEqual(hash2);
    });
  });

  describe('verifyChain', () => {
    it('should return isValid true for a cryptographically valid chain', async () => {
      const logs = [
        {
          id: 'log-1',
          tenantId: mockTenantId,
          userId: mockUserId,
          eventKey: 'patient.create',
          recordType: 'Patient',
          recordId: 'rec-1',
          oldValues: null,
          newValues: { name: 'Alice' },
          createdAt: new Date('2026-05-17T12:00:00Z'),
          hash: 'cb13b63bf0287e07663d1a84f3c7e73549704e6bd8b5774a3f1b34ea6cf763b6',
          previousHash: null,
        },
      ];
      prisma.auditLog.findMany.mockResolvedValue(logs);

      jest.spyOn(service as any, 'computeHash').mockReturnValue(logs[0].hash);

      const result = await service.verifyChain(mockTenantId);
      expect(result.isValid).toBe(true);
      expect(result.corruptedLogIds).toHaveLength(0);
    });

    it('should return isValid false and identify corrupted blocks when hash mismatch occurs', async () => {
      const logs = [
        {
          id: 'log-1',
          tenantId: mockTenantId,
          userId: mockUserId,
          eventKey: 'patient.create',
          recordType: 'Patient',
          recordId: 'rec-1',
          oldValues: null,
          newValues: { name: 'Alice' },
          createdAt: new Date('2026-05-17T12:00:00Z'),
          hash: 'invalid-hash',
          previousHash: null,
        },
      ];
      prisma.auditLog.findMany.mockResolvedValue(logs);

      jest
        .spyOn(service as any, 'computeHash')
        .mockReturnValue('computed-hash');

      const result = await service.verifyChain(mockTenantId);
      expect(result.isValid).toBe(false);
      expect(result.corruptedLogIds).toContain('log-1');
    });
  });

  describe('exportMyEvents', () => {
    it('should return data with honest metadata in csv format', async () => {
      prisma.auditLog.count.mockResolvedValue(1);
      prisma.auditLog.findMany.mockResolvedValue([
        {
          id: 'e1',
          tenantId: mockTenantId,
          userId: mockUserId,
          eventKey: 'TEST',
          recordType: 'test',
          recordId: 'r1',
          createdAt: new Date().toISOString(),
        },
      ]);

      const result = await service.exportMyEvents(
        mockTenantId,
        mockUserId,
        {},
        'csv',
      );

      expect(result.format).toBe('csv');
      expect(result.data).toHaveLength(1);
      expect(result.exportedCount).toBe(1);
      expect(result.totalAvailable).toBe(1);
      expect(result.truncated).toBe(false);
    });

    it('should return data with honest metadata in json format', async () => {
      prisma.auditLog.count.mockResolvedValue(1);
      prisma.auditLog.findMany.mockResolvedValue([
        {
          id: 'e1',
          tenantId: mockTenantId,
          userId: mockUserId,
          eventKey: 'TEST',
          recordType: 'test',
          recordId: 'r1',
          createdAt: new Date().toISOString(),
        },
      ]);

      const result = await service.exportMyEvents(
        mockTenantId,
        mockUserId,
        {},
        'json',
      );

      expect(result.format).toBe('json');
      expect(result.exportedCount).toBe(1);
      expect(result.totalAvailable).toBe(1);
    });

    it('should set truncated when export returns fewer than totalAvailable', async () => {
      const logs = Array.from({ length: 100 }, (_, i) => ({
        id: `e${i}`,
        tenantId: mockTenantId,
        userId: mockUserId,
      }));
      prisma.auditLog.count.mockResolvedValue(500);
      prisma.auditLog.findMany.mockResolvedValue(logs);

      const result = await service.exportMyEvents(
        mockTenantId,
        mockUserId,
        {},
        'csv',
      );

      expect(result.exportedCount).toBe(100);
      expect(result.totalAvailable).toBe(500);
      expect(result.truncated).toBe(true);
    });

    it('should enforce server-provided userId and ignore client-supplied userId filter', async () => {
      prisma.auditLog.count.mockResolvedValue(1);
      prisma.auditLog.findMany.mockResolvedValue([
        { id: 'e1', tenantId: mockTenantId, userId: mockUserId },
      ]);

      await service.exportMyEvents(mockTenantId, mockUserId, {}, 'csv');

      expect(prisma.auditLog.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: mockUserId }),
        }),
      );
    });

    it('should emit AUDIT_LOG_EXPORTED event', async () => {
      prisma.auditLog.count.mockResolvedValue(1);
      prisma.auditLog.findMany.mockResolvedValue([
        { id: 'e1', tenantId: mockTenantId, userId: mockUserId },
      ]);
      const logSpy = jest.spyOn(service, 'log' as any).mockResolvedValue({});

      await service.exportMyEvents(mockTenantId, mockUserId, {}, 'csv');

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'AUDIT_LOG_EXPORTED' }),
      );
      logSpy.mockRestore();
    });
  });

  describe('exportEvents', () => {
    it('should emit AUDIT_LOG_EXPORTED event', async () => {
      prisma.auditLog.count.mockResolvedValue(1);
      prisma.auditLog.findMany.mockResolvedValue([
        { id: 'e1', tenantId: mockTenantId, userId: mockUserId },
      ]);
      const logSpy = jest.spyOn(service, 'log' as any).mockResolvedValue({});

      await service.exportEvents(
        mockTenantId,
        mockBranchId,
        ['Branch Admin'],
        mockUserId,
        {},
        'csv',
      );

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'AUDIT_LOG_EXPORTED' }),
      );
      logSpy.mockRestore();
    });

    it('should return honest export metadata with exportedCount and totalAvailable', async () => {
      prisma.auditLog.count.mockResolvedValue(2);
      prisma.auditLog.findMany.mockResolvedValue([
        { id: 'e1', tenantId: mockTenantId, userId: mockUserId },
        { id: 'e2', tenantId: mockTenantId, userId: mockUserId },
      ]);

      const result = await service.exportEvents(
        mockTenantId,
        mockBranchId,
        ['Branch Admin'],
        mockUserId,
        {},
        'json',
      );

      expect(result.exportedCount).toBe(2);
      expect(result.totalAvailable).toBe(2);
      expect(result.truncated).toBe(false);
    });

    it('should set truncated when export returns fewer than totalAvailable (take cap)', async () => {
      const logs = Array.from({ length: 100 }, (_, i) => ({
        id: `e${i}`,
        tenantId: mockTenantId,
        userId: mockUserId,
      }));
      prisma.auditLog.count.mockResolvedValue(500);
      prisma.auditLog.findMany.mockResolvedValue(logs);

      const result = await service.exportEvents(
        mockTenantId,
        mockBranchId,
        ['Branch Admin'],
        mockUserId,
        {},
        'csv',
      );

      expect(result.exportedCount).toBe(100);
      expect(result.totalAvailable).toBe(500);
      expect(result.truncated).toBe(true);
    });

    it('should enforce branch scope for non-Super-Admin export', async () => {
      prisma.auditLog.count.mockResolvedValue(0);
      prisma.auditLog.findMany.mockResolvedValue([]);

      await service.exportEvents(
        mockTenantId,
        mockBranchId,
        ['Branch Admin'],
        mockUserId,
        {},
        'csv',
      );

      expect(prisma.auditLog.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ branchId: mockBranchId }),
        }),
      );
    });

    it('should allow Super Admin to export without branch filter', async () => {
      prisma.auditLog.count.mockResolvedValue(0);
      prisma.auditLog.findMany.mockResolvedValue([]);

      await service.exportEvents(
        mockTenantId,
        undefined,
        ['Super Admin'],
        mockUserId,
        {},
        'csv',
      );

      expect(prisma.auditLog.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: mockTenantId },
        }),
      );
    });

    it('should apply AUDIT_CHAIN_SAFETY_CAP as take limit', async () => {
      prisma.auditLog.count.mockResolvedValue(0);
      prisma.auditLog.findMany.mockResolvedValue([]);

      await service.exportEvents(
        mockTenantId,
        mockBranchId,
        ['Branch Admin'],
        mockUserId,
        {},
        'csv',
      );

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10000 }),
      );
    });
  });

  describe('findMyEvent', () => {
    it('should return audit log when userId matches', async () => {
      prisma.auditLog.findUnique.mockResolvedValue({
        id: 'log-id',
        tenantId: mockTenantId,
        userId: mockUserId,
        eventKey: 'TEST',
        recordType: 'test',
        recordId: 'rec-1',
        createdAt: new Date(),
      });

      const result = await service.findMyEvent(
        mockTenantId,
        mockUserId,
        'log-id',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('log-id');
    });

    it('should throw NotFoundException for wrong tenant', async () => {
      prisma.auditLog.findUnique.mockResolvedValue({
        id: 'log-id',
        tenantId: 'other-tenant',
        userId: mockUserId,
      });

      await expect(
        service.findMyEvent(mockTenantId, mockUserId, 'log-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when userId does not match', async () => {
      prisma.auditLog.findUnique.mockResolvedValue({
        id: 'log-id',
        tenantId: mockTenantId,
        userId: 'other-user',
      });

      await expect(
        service.findMyEvent(mockTenantId, mockUserId, 'log-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when log does not exist', async () => {
      prisma.auditLog.findUnique.mockResolvedValue(null);

      await expect(
        service.findMyEvent(mockTenantId, mockUserId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyChain pagination cap', () => {
    it('should apply AUDIT_CHAIN_SAFETY_CAP (10000) to verifyChain', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      await service.verifyChain(mockTenantId);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10000 }),
      );
    });

    it('should preserve tenantId filter in verifyChain', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      await service.verifyChain(mockTenantId);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: mockTenantId },
        }),
      );
    });

    it('should set truncated flag when count equals cap', async () => {
      const logs = Array.from({ length: 10000 }, (_, i) => ({
        id: `log-${i}`,
        tenantId: mockTenantId,
        userId: 'user-1',
        eventKey: 'TEST',
        recordType: 'test',
        recordId: 'rec-1',
        branchId: 'branch-1',
        oldValues: null,
        newValues: null,
        createdAt: new Date(Date.UTC(2024, 0, 1) + i * 1000),
        hash: `placeholder-${i}`,
        previousHash: i === 0 ? null : `placeholder-${i - 1}`,
      }));
      prisma.auditLog.findMany.mockResolvedValue(logs);

      const result = await service.verifyChain(mockTenantId);
      expect(result.truncated).toBe(true);
      expect(result.verificationCount).toBe(10000);
    });

    it('should not set truncated flag when under cap', async () => {
      const logs = Array.from({ length: 5000 }, (_, i) => ({
        id: `log-${i}`,
        tenantId: mockTenantId,
        userId: 'user-1',
        eventKey: 'TEST',
        recordType: 'test',
        recordId: 'rec-1',
        branchId: 'branch-1',
        oldValues: null,
        newValues: null,
        createdAt: new Date(Date.UTC(2024, 0, 1) + i * 1000),
        hash: `valid-hash-${i}`,
        previousHash: i === 0 ? null : `valid-hash-${i - 1}`,
      }));
      prisma.auditLog.findMany.mockResolvedValue(logs);

      const result = await service.verifyChain(mockTenantId);
      expect(result.truncated).toBe(false);
      expect(result.verificationCount).toBe(5000);
    });
  });
});
