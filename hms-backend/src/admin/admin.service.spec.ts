import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb) => cb(prisma)),
      department: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    audit = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  const mockTenantId = 'tenant-uuid';
  const mockBranchId = 'branch-uuid';
  const mockUserId = 'user-uuid';

  describe('createDepartment', () => {
    it('should create a department and log audit', async () => {
      const dto = { name: 'Nursing', code: 'NUR' };
      prisma.department.findUnique.mockResolvedValue(null);
      prisma.department.create.mockResolvedValue({ id: 'dept-1', ...dto });

      const result = await service.createDepartment(
        mockTenantId,
        mockBranchId,
        mockUserId,
        dto,
      );

      expect(result.id).toBe('dept-1');
      expect(prisma.department.create).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'DEPARTMENT_CREATED' }),
        expect.anything(),
        mockBranchId,
      );
    });

    it('should throw ConflictException if department code exists', async () => {
      prisma.department.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.createDepartment(mockTenantId, mockBranchId, mockUserId, {
          name: 'test',
          code: 'NUR',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Tenant Isolation', () => {
    it('should filter getDepartments by tenantId', async () => {
      await service.getDepartments(mockTenantId, mockBranchId);
      expect(prisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: mockTenantId, branchId: mockBranchId },
        }),
      );
    });
  });
});
