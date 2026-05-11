/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { HrService } from './hr.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('HrService', () => {
  let service: HrService;
  let prisma: PrismaService;

  const mockTenantId = '00000000-0000-0000-0000-000000000001';
  const mockBranchId = '00000000-0000-0000-0000-000000000010';
  const mockUserId = 'user-1';

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
    it('should create an employee and an initial branch assignment', async () => {
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: 'Nurse',
        joiningDate: '2026-01-01',
        salary: 50000,
        primaryBranchId: mockBranchId,
      };

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
      );

      expect(prisma.employee.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          employeeBranches: {
            create: {
              tenantId: mockTenantId,
              branchId: mockBranchId,
              isPrimary: true,
              isActive: true,
            },
          },
        }),
        include: { employeeBranches: true },
      });
      expect(result.employeeNumber).toBe('EMP-00001');
    });
  });

  describe('generatePayslip', () => {
    it('should generate a payslip with a branchId snapshot', async () => {
      const dto = {
        employeeId: 'emp-1',
        periodStart: '2026-05-01',
        periodEnd: '2026-05-31',
        totalAllowances: 1000,
        totalDeductions: 500,
      };

      const mockEmployee = {
        id: 'emp-1',
        salary: 50000,
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
      );

      expect(prisma.payslip.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            branchId: mockBranchId,
          }),
        }),
      );
      expect(result.branchId).toBe(mockBranchId);
    });

    it('should fail if employee has no active primary branch', async () => {
      const dto = {
        employeeId: 'emp-1',
        periodStart: '2026-05-01',
        periodEnd: '2026-05-31',
        totalAllowances: 1000,
        totalDeductions: 500,
      };

      const mockEmployee = {
        id: 'emp-1',
        salary: 50000,
        employeeBranches: [],
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);

      await expect(
        service.generatePayslip(mockTenantId, mockUserId, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
