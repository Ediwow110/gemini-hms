import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateEmployeeDto,
  CreateDepartmentDto,
  CreatePayslipDto,
  ListPayslipsFiltersDto,
  CreateLeaveRequestDto,
  CreateLicenseRecordDto,
} from './dto/hr.dto';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { RequestUser } from '../common/types/authenticated-request.type';

@Injectable()
export class HrService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private numbering: NumberingService,
  ) {}

  private isTenantWideHr(roles: string[]): boolean {
    return roles.some((r) =>
      ['Super Admin', 'HR Manager', 'HR Staff'].includes(r),
    );
  }

  private isBranchScopedHr(roles: string[]): boolean {
    return roles.some((r) => ['Branch Admin', 'Branch Manager'].includes(r));
  }

  async createDepartment(
    tenantId: string,
    userId: string,
    dto: CreateDepartmentDto,
  ) {
    const department = await this.prisma.department.create({
      data: {
        tenantId,
        ...dto,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'DEPARTMENT_CREATED',
      recordType: 'Department',
      recordId: department.id,
      newValues: department,
    });

    return department;
  }

  async createEmployee(
    tenantId: string,
    userId: string,
    dto: CreateEmployeeDto,
    user: RequestUser,
  ) {
    const roles = user.roles || [];

    const targetBranchId = dto.branchId;

    if (this.isBranchScopedHr(roles)) {
      if (!user.branchId) {
        throw new BadRequestException('Branch context required');
      }
      if (targetBranchId !== user.branchId) {
        throw new ForbiddenException(
          'Branch Admin can only create employees for their own branch',
        );
      }
    } else if (!this.isTenantWideHr(roles) && !roles.includes('Super Admin')) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // 1. Generate employee number atomically via NumberingService to prevent race conditions
    return await this.prisma.$transaction(async (tx) => {
      const employeeNumber = await this.numbering.generateNumber(
        tenantId,
        'EMPLOYEE',
        undefined,
        tx,
      );

      // 2. Create Employee
      const employee = await tx.employee.create({
        data: {
          tenantId,
          branchId: targetBranchId,
          userId: dto.userId || null,
          employeeNumber,
          department: dto.department,
          position: dto.position,
          hireDate: new Date(dto.hireDate),
          status: 'ACTIVE',
          firstName: dto.firstName || '',
          lastName: dto.lastName || '',
          salary: dto.salary ? new Prisma.Decimal(dto.salary) : null,
        },
      });

      await this.audit.log({
        tenantId,
        userId,
        eventKey: 'EMPLOYEE_CREATED',
        recordType: 'Employee',
        recordId: employee.id,
        newValues: employee,
      });

      return employee;
    });
  }

  async getEmployeeById(
    tenantId: string,
    employeeId: string,
    user?: RequestUser,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      include: {
        attendanceLogs: true,
        leaveRequests: true,
        licenses: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (user && user.roles) {
      if (this.isBranchScopedHr(user.roles)) {
        if (employee.branchId !== user.branchId) {
          throw new ForbiddenException(
            'Branch Admin can only view employees in their branch',
          );
        }
      } else if (
        !this.isTenantWideHr(user.roles) &&
        !user.roles.includes('Super Admin')
      ) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return employee;
  }

  async updateEmployeeStatus(
    tenantId: string,
    actorId: string,
    employeeId: string,
    status: string,
    user: RequestUser,
  ) {
    const roles = user.roles || [];
    if (!this.isTenantWideHr(roles) && !roles.includes('Super Admin')) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatedEmployee = await tx.employee.update({
        where: { id: employeeId },
        data: { status },
      });

      if (['RESIGNED', 'TERMINATED'].includes(status) && employee.userId) {
        // Automatically deactivate the linked user
        await tx.user.update({
          where: { id: employee.userId },
          data: {
            status: 'INACTIVE',
            deactivatedAt: new Date(),
            deactivatedReason: `Employee set to status: ${status}`,
            tokenVersion: { increment: 1 },
          },
        });
      }

      await this.audit.log(
        {
          tenantId,
          userId: actorId,
          eventKey: 'EMPLOYEE_STATUS_UPDATED',
          recordType: 'Employee',
          recordId: employeeId,
          oldValues: { status: employee.status },
          newValues: { status },
        },
        tx,
      );

      return updatedEmployee;
    });
  }

  async createLeaveRequest(
    tenantId: string,
    actorId: string,
    dto: CreateLeaveRequestDto,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, tenantId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const leave = await this.prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: 'PENDING',
        reason: dto.reason,
      },
    });

    await this.audit.log({
      tenantId,
      userId: actorId,
      eventKey: 'LEAVE_REQUEST_CREATED',
      recordType: 'LeaveRequest',
      recordId: leave.id,
      newValues: leave,
    });

    return leave;
  }

  async getLeaveRequests(
    tenantId: string,
    user: RequestUser,
    filters: { status?: string; employeeId?: string } = {},
  ) {
    const roles = user.roles || [];

    const where: Record<string, unknown> = { tenantId };

    let doctorOrNurseSelfId: string | null = null;
    if (this.isBranchScopedHr(roles)) {
      if (!user.branchId) {
        throw new BadRequestException('Branch context required');
      }
      where.employee = { branchId: user.branchId };
    } else if (roles.includes('Doctor') || roles.includes('Nurse')) {
      const self = await this.prisma.employee.findFirst({
        where: { tenantId, userId: user.userId },
        select: { id: true },
      });
      if (!self) {
        return [];
      }
      doctorOrNurseSelfId = self.id;
      where.employeeId = self.id;
    } else if (!this.isTenantWideHr(roles) && !roles.includes('Super Admin')) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.employeeId) {
      // Doctor/Nurse cannot widen scope via employeeId filter; self-only is enforced.
      if (doctorOrNurseSelfId && filters.employeeId !== doctorOrNurseSelfId) {
        throw new ForbiddenException(
          'Doctor/Nurse can only view their own leave requests',
        );
      }
      where.employeeId = filters.employeeId;
    }

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            branchId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveLeaveRequest(
    tenantId: string,
    actorId: string,
    leaveId: string,
    user: RequestUser,
  ) {
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id: leaveId, tenantId },
      include: { employee: true },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    if (leave.employee.userId === actorId) {
      throw new ForbiddenException('Cannot self-approve leave request');
    }

    const roles = user.roles || [];
    if (this.isBranchScopedHr(roles)) {
      if (leave.employee.branchId !== user.branchId) {
        throw new ForbiddenException(
          'Branch Admin can only approve leave for employees in their branch',
        );
      }
    } else if (!this.isTenantWideHr(roles) && !roles.includes('Super Admin')) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: 'APPROVED',
        approvedById: actorId,
      },
    });

    await this.audit.log({
      tenantId,
      userId: actorId,
      eventKey: 'LEAVE_REQUEST_APPROVED',
      recordType: 'LeaveRequest',
      recordId: leaveId,
      newValues: updated,
    });

    return updated;
  }

  async rejectLeaveRequest(
    tenantId: string,
    actorId: string,
    leaveId: string,
    user: RequestUser,
  ) {
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id: leaveId, tenantId },
      include: { employee: true },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    if (leave.employee.userId === actorId) {
      throw new ForbiddenException('Cannot self-reject leave request');
    }

    const roles = user.roles || [];
    if (this.isBranchScopedHr(roles)) {
      if (leave.employee.branchId !== user.branchId) {
        throw new ForbiddenException(
          'Branch Admin can only reject leave for employees in their branch',
        );
      }
    } else if (!this.isTenantWideHr(roles) && !roles.includes('Super Admin')) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: 'REJECTED',
        approvedById: actorId,
      },
    });

    await this.audit.log({
      tenantId,
      userId: actorId,
      eventKey: 'LEAVE_REQUEST_REJECTED',
      recordType: 'LeaveRequest',
      recordId: leaveId,
      newValues: updated,
    });

    return updated;
  }

  async createLicenseRecord(
    tenantId: string,
    actorId: string,
    dto: CreateLicenseRecordDto,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, tenantId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const license = await this.prisma.licenseRecord.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        licenseType: dto.licenseType,
        licenseNumber: dto.licenseNumber,
        issuedAt: new Date(dto.issuedAt),
        expiresAt: new Date(dto.expiresAt),
        status: 'ACTIVE',
      },
    });

    await this.audit.log({
      tenantId,
      userId: actorId,
      eventKey: 'LICENSE_RECORD_CREATED',
      recordType: 'LicenseRecord',
      recordId: license.id,
      newValues: license,
    });

    return license;
  }

  async getLicensesByEmployee(
    tenantId: string,
    employeeId: string,
    user?: RequestUser,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (user && user.roles) {
      if (this.isBranchScopedHr(user.roles)) {
        if (employee.branchId !== user.branchId) {
          throw new ForbiddenException(
            'Branch Admin can only view licenses for employees in their branch',
          );
        }
      } else if (
        !this.isTenantWideHr(user.roles) &&
        !user.roles.includes('Super Admin')
      ) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return this.prisma.licenseRecord.findMany({
      where: { employeeId, tenantId },
    });
  }

  async generatePayslip(
    tenantId: string,
    userId: string,
    dto: CreatePayslipDto,
    user: RequestUser,
  ) {
    const roles = user.roles || [];

    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, tenantId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    let targetBranchId: string;

    if (this.isBranchScopedHr(roles)) {
      if (!user.branchId) {
        throw new BadRequestException('Branch context required');
      }
      if (employee.branchId !== user.branchId) {
        throw new ForbiddenException(
          'Branch Admin can only generate payslips for employees in their branch',
        );
      }
      targetBranchId = user.branchId;
    } else if (this.isTenantWideHr(roles) || roles.includes('Super Admin')) {
      targetBranchId = employee.branchId;
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    const basicSalary = employee.salary ? Number(employee.salary) : 0;
    const netSalary = basicSalary + dto.totalAllowances - dto.totalDeductions;

    const payslip = await this.prisma.payslip.create({
      data: {
        tenantId,
        branchId: targetBranchId,
        employeeId: dto.employeeId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        basicSalary,
        totalAllowances: dto.totalAllowances,
        totalDeductions: dto.totalDeductions,
        netSalary,
        status: 'DRAFT',
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'PAYSLIP_GENERATED',
      recordType: 'Payslip',
      recordId: payslip.id,
      newValues: payslip,
    });

    return payslip;
  }

  async listPayslips(
    tenantId: string,
    user: RequestUser,
    filters: ListPayslipsFiltersDto = {},
  ) {
    const roles = user.roles || [];

    const where: Record<string, unknown> = { tenantId };

    if (this.isBranchScopedHr(roles)) {
      if (!user.branchId) {
        throw new BadRequestException('Branch context required');
      }
      if (filters.branchId && filters.branchId !== user.branchId) {
        throw new ForbiddenException(
          'Branch Admin can only view payslips for their own branch',
        );
      }
      where.branchId = user.branchId;
    } else if (!this.isTenantWideHr(roles) && !roles.includes('Super Admin')) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.branchId) {
      where.branchId = filters.branchId;
    }
    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    return this.prisma.payslip.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            branchId: true,
          },
        },
      },
      orderBy: [{ periodEnd: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getEmployees(tenantId: string, user: RequestUser) {
    const roles = user.roles || [];

    if (this.isTenantWideHr(roles) || roles.includes('Super Admin')) {
      return this.prisma.employee.findMany({
        where: { tenantId },
        orderBy: { employeeNumber: 'asc' },
      });
    }

    if (this.isBranchScopedHr(roles)) {
      if (!user.branchId) {
        throw new BadRequestException('Branch context required');
      }
      return this.prisma.employee.findMany({
        where: {
          tenantId,
          branchId: user.branchId,
        },
        orderBy: { employeeNumber: 'asc' },
      });
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async getAssignments(tenantId: string, branchId: string, user: RequestUser) {
    const roles = user.roles || [];
    if (
      !this.isTenantWideHr(roles) &&
      !roles.includes('Super Admin') &&
      !this.isBranchScopedHr(roles)
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.employeeBranch.findMany({
      where: { tenantId, branchId },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeNumber: true },
        },
        branch: {
          select: { name: true, code: true },
        },
      },
    });
  }

  async getAttendance(tenantId: string, branchId: string, user: RequestUser) {
    const roles = user.roles || [];
    if (
      !this.isTenantWideHr(roles) &&
      !roles.includes('Super Admin') &&
      !this.isBranchScopedHr(roles)
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.attendanceLog.findMany({
      where: { tenantId, branchId },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDepartments(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async assignEmployeeToBranch(
    tenantId: string,
    actorId: string,
    employeeId: string,
    branchId: string,
    scheduleData: { isPrimary?: boolean } = {},
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Validate employee and branch belong to the same isolated tenantId context
      const employee = await tx.employee.findFirst({
        where: { id: employeeId, tenantId },
      });
      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      const branch = await tx.branch.findFirst({
        where: { id: branchId, tenantId },
      });
      if (!branch) {
        throw new NotFoundException('Branch not found');
      }

      // 2. Enforce database-level overlap check across multiple physical branches
      const activeAssignments = await tx.employeeBranch.findMany({
        where: { employeeId, isActive: true },
      });

      const hasOtherBranchActive = activeAssignments.some(
        (a) => a.branchId !== branchId,
      );

      if (hasOtherBranchActive) {
        throw new BadRequestException(
          'Assignment introduces calendar timeline overlaps for the same employee asset across multiple physical branches.',
        );
      }

      // 3. Upsert or create the EmployeeBranch record
      const existing = await tx.employeeBranch.findUnique({
        where: {
          tenantId_employeeId_branchId: {
            tenantId,
            employeeId,
            branchId,
          },
        },
      });

      let employeeBranch;
      if (existing) {
        employeeBranch = await tx.employeeBranch.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            isPrimary: scheduleData.isPrimary ?? existing.isPrimary,
          },
        });
      } else {
        employeeBranch = await tx.employeeBranch.create({
          data: {
            tenantId,
            employeeId,
            branchId,
            isActive: true,
            isPrimary: scheduleData.isPrimary ?? false,
          },
        });
      }

      // 4. Log workforce audit log
      await this.audit.log(
        {
          tenantId,
          userId: actorId,
          eventKey: 'WORKFORCE_BRANCH_ASSIGNED',
          recordType: 'EmployeeBranch',
          recordId: employeeBranch.id,
          newValues: employeeBranch,
        },
        tx,
      );

      return employeeBranch;
    });
  }
}
