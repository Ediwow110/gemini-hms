/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { HrService } from './hr.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { RequestUser } from '../common/types/authenticated-request.type';
import { CreateEmployeeDto } from './dto/hr.dto';

describe('HrService', () => {
  let service: HrService;
  let prisma: PrismaService;

  const mockTenantId = '00000000-0000-0000-0000-000000000001';
  const mockBranchId = '00000000-0000-0000-0000-000000000010';
  const mockUserId = 'user-1';

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
    branchId: '00000000-0000-0000-0000-000000000020',
    roles: ['Branch Admin'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrService,
        {
          provide: PrismaService,
          useValue: {
            employee: {
              count: jest.fn(),
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
            employeeBranch: {
              create: jest.fn(),
            },
            payslip: {
              create: jest.fn(),
            },
            department: {
              create: jest.fn(),
            },
            $transaction: jest.fn(async (cb) => {
              const mockTx = {
                employee: {
                  count: jest
                    .fn()
                    .mockImplementation((args) => prisma.employee.count(args)),
                  create: jest
                    .fn()
                    .mockImplementation((args) => prisma.employee.create(args)),
                  findFirst: jest
                    .fn()
                    .mockImplementation((args) =>
                      prisma.employee.findFirst(args),
                    ),
                  findMany: jest
                    .fn()
                    .mockImplementation((args) =>
                      prisma.employee.findMany(args),
                    ),
                },
                employeeBranch: {
                  create: jest
                    .fn()
                    .mockImplementation((args) =>
                      prisma.employeeBranch.create(args),
                    ),
                },
                payslip: {
                  create: jest
                    .fn()
                    .mockImplementation((args) => prisma.payslip.create(args)),
                },
                department: {
                  create: jest
                    .fn()
                    .mockImplementation((args) =>
                      prisma.department.create(args),
                    ),
                },
              };
              return cb(mockTx);
            }),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HrService>(HrService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEmployee', () => {
    const dto: CreateEmployeeDto = {
      firstName: 'John',
      lastName: 'Doe',
      branchId: mockBranchId,
      department: 'Nursing',
      position: 'Nurse',
      hireDate: '2026-01-01',
      salary: 50000,
    };

    it('should allow Super Admin to create an employee for any branch', async () => {
      (prisma.employee.count as jest.Mock).mockResolvedValue(0);
      (prisma.employee.create as jest.Mock).mockResolvedValue({
        id: 'emp-1',
        ...dto,
        employeeNumber: 'EMP-00001',
      });

      const result = await service.createEmployee(
        mockTenantId,
        mockUserId,
        dto,
        superAdminUser,
      );

      expect(prisma.employee.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            branchId: mockBranchId,
          }),
        }),
      );
      expect(result.employeeNumber).toBe('EMP-00001');
    });

    it('should allow Branch Admin to create an employee for their own branch', async () => {
      (prisma.employee.count as jest.Mock).mockResolvedValue(0);
      (prisma.employee.create as jest.Mock).mockResolvedValue({
        id: 'emp-1',
        ...dto,
        employeeNumber: 'EMP-00001',
      });

      const result = await service.createEmployee(
        mockTenantId,
        mockUserId,
        dto,
        branchAdminUser,
      );

      expect(prisma.employee.create).toHaveBeenCalled();
      expect(result.id).toBe('emp-1');
    });

    it('should reject Branch Admin creating an employee for a different branch', async () => {
      await expect(
        service.createEmployee(
          mockTenantId,
          mockUserId,
          dto,
          otherBranchAdminUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should fail if Branch Admin has no branch context', async () => {
      const invalidBranchAdmin: RequestUser = {
        tenantId: mockTenantId,
        roles: ['Branch Admin'],
      };
      await expect(
        service.createEmployee(
          mockTenantId,
          mockUserId,
          dto,
          invalidBranchAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generatePayslip', () => {
    const dto = {
      employeeId: 'emp-1',
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
      totalAllowances: 1000,
      totalDeductions: 500,
    };

    it('should allow Super Admin to generate payslip for any tenant employee', async () => {
      const mockEmployee = {
        id: 'emp-1',
        salary: 50000,
        branchId: mockBranchId,
        employeeBranches: [
          { branchId: mockBranchId, isPrimary: true, isActive: true },
        ],
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);
      (prisma.payslip.create as jest.Mock).mockResolvedValue({
        id: 'ps-1',
        ...dto,
        branchId: mockBranchId,
      });

      const result = await service.generatePayslip(
        mockTenantId,
        mockUserId,
        dto,
        superAdminUser,
      );

      expect(prisma.payslip.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ branchId: mockBranchId }),
        }),
      );
      expect(result.branchId).toBe(mockBranchId);
    });

    it('should allow Branch Admin to generate payslip for same-branch employee', async () => {
      const mockEmployee = {
        id: 'emp-1',
        salary: 50000,
        branchId: mockBranchId,
        employeeBranches: [
          { branchId: mockBranchId, isPrimary: true, isActive: true },
        ],
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);
      (prisma.payslip.create as jest.Mock).mockResolvedValue({
        id: 'ps-1',
        ...dto,
        branchId: mockBranchId,
      });

      const result = await service.generatePayslip(
        mockTenantId,
        mockUserId,
        dto,
        branchAdminUser,
      );

      expect(result.branchId).toBe(mockBranchId);
    });

    it('should reject Branch Admin generating payslip for cross-branch employee', async () => {
      const mockEmployee = {
        id: 'emp-1',
        salary: 50000,
        branchId: 'other-branch',
        employeeBranches: [
          { branchId: 'other-branch', isPrimary: true, isActive: true },
        ],
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);

      await expect(
        service.generatePayslip(mockTenantId, mockUserId, dto, branchAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getEmployees', () => {
    it('should return all employees for Super Admin', async () => {
      (prisma.employee.findMany as jest.Mock).mockResolvedValue([
        { id: 'emp-1' },
        { id: 'emp-2' },
      ]);

      const result = await service.getEmployees(mockTenantId, superAdminUser);

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: mockTenantId } }),
      );
      expect(result.length).toBe(2);
    });

    it('should return only same-branch employees for Branch Admin', async () => {
      (prisma.employee.findMany as jest.Mock).mockResolvedValue([
        { id: 'emp-1' },
      ]);

      const result = await service.getEmployees(mockTenantId, branchAdminUser);

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockTenantId,
            branchId: mockBranchId,
          }),
        }),
      );
      expect(result.length).toBe(1);
    });

    it('should fail if Branch Admin has no branch context', async () => {
      const invalidBranchAdmin: RequestUser = {
        tenantId: mockTenantId,
        roles: ['Branch Admin'],
      };
      await expect(
        service.getEmployees(mockTenantId, invalidBranchAdmin),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
