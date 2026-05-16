import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { HrService } from './hr.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmployeeStatus } from '@prisma/client';

describe('HrService', () => {
  let service: HrService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb) => cb(prisma)),
      employee: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      attendanceLog: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    audit = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<HrService>(HrService);
  });

  const mockTenantId = 'tenant-uuid';
  const mockBranchId = 'branch-uuid';
  const mockUserId = 'user-uuid';

  describe('createEmployee', () => {
    it('should create an employee and log audit', async () => {
      const dto = {
        employeeIdNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: 'Nurse',
        hireDate: '2026-01-01',
        salary: 50000,
      };
      prisma.employee.findUnique.mockResolvedValue(null);
      prisma.employee.create.mockResolvedValue({ id: 'emp-1', ...dto });

      const result = await service.createEmployee(
        mockTenantId,
        mockBranchId,
        mockUserId,
        dto,
      );

      expect(result.id).toBe('emp-1');
      expect(prisma.employee.create).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'EMPLOYEE_CREATED' }),
        expect.anything(),
        mockBranchId,
      );
    });

    it('should throw ConflictException if Employee ID number exists', async () => {
      prisma.employee.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.createEmployee(mockTenantId, mockBranchId, mockUserId, {
          employeeIdNumber: 'EMP001',
          firstName: 'a',
          lastName: 'b',
          jobTitle: 'c',
          hireDate: '2026',
          salary: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Offboarding Lock (The Golden Rule)', () => {
    it('terminating an employee should revoke user access transactionally', async () => {
      const employeeId = 'emp-1';
      const linkedUserId = 'linked-user-uuid';
      const employee = {
        id: employeeId,
        tenantId: mockTenantId,
        userId: linkedUserId,
      };

      prisma.employee.findFirst.mockResolvedValue(employee);
      prisma.employee.update.mockResolvedValue({
        ...employee,
        status: EmployeeStatus.TERMINATED,
      });
      prisma.user.update.mockResolvedValue({
        id: linkedUserId,
        isActive: false,
      });

      await service.updateEmployeeStatus(
        mockTenantId,
        mockBranchId,
        mockUserId,
        employeeId,
        {
          status: EmployeeStatus.TERMINATED,
          reason: 'Violation of policy',
        },
      );

      expect(prisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: employeeId },
          data: expect.objectContaining({ status: EmployeeStatus.TERMINATED }),
        }),
      );

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: linkedUserId },
          data: expect.objectContaining({ isActive: false }),
        }),
      );

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'EMPLOYEE_TERMINATED' }),
        expect.anything(),
        mockBranchId,
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'USER_ACCESS_REVOKED' }),
        expect.anything(),
        mockBranchId,
      );
    });

    it('should rollback termination if audit log fails', async () => {
      prisma.employee.findFirst.mockResolvedValue({ id: 'e1', userId: 'u1' });
      audit.log.mockRejectedValue(new Error('Audit Failure'));

      await expect(
        service.updateEmployeeStatus(
          mockTenantId,
          mockBranchId,
          mockUserId,
          'e1',
          {
            status: EmployeeStatus.TERMINATED,
          },
        ),
      ).rejects.toThrow('Audit Failure');

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('Clock-In Constraints', () => {
    it('should throw ForbiddenException if employee is not ACTIVE', async () => {
      prisma.employee.findFirst.mockResolvedValue({
        id: 'e1',
        status: EmployeeStatus.TERMINATED,
      });

      await expect(
        service.clockIn(mockTenantId, mockBranchId, mockUserId, {
          employeeId: 'e1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if already clocked in today', async () => {
      prisma.employee.findFirst.mockResolvedValue({
        id: 'e1',
        status: EmployeeStatus.ACTIVE,
      });
      prisma.attendanceLog.findFirst.mockResolvedValue({ id: 'log1' });

      await expect(
        service.clockIn(mockTenantId, mockBranchId, mockUserId, {
          employeeId: 'e1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create attendance log for active employee', async () => {
      prisma.employee.findFirst.mockResolvedValue({
        id: 'e1',
        status: EmployeeStatus.ACTIVE,
      });
      prisma.attendanceLog.findFirst.mockResolvedValue(null);
      prisma.attendanceLog.create.mockResolvedValue({ id: 'log2' });

      const result = await service.clockIn(
        mockTenantId,
        mockBranchId,
        mockUserId,
        { employeeId: 'e1' },
      );

      expect(result.id).toBe('log2');
      expect(prisma.attendanceLog.create).toHaveBeenCalled();
    });
  });

  describe('Tenant Isolation', () => {
    it('should fail if employee belongs to another tenant', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);
      await expect(
        service.updateEmployeeStatus(
          'tenant-A',
          mockBranchId,
          mockUserId,
          'emp-B',
          {
            status: EmployeeStatus.TERMINATED,
          },
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
