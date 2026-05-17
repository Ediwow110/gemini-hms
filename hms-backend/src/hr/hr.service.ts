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
  CreateLeaveRequestDto,
  CreateLicenseRecordDto,
} from './dto/hr.dto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/types/authenticated-request.type';

@Injectable()
export class HrService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
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

    // 1. Generate employee number atomically within transaction to prevent race condition
    return await this.prisma.$transaction(async (tx) => {
      const count = await tx.employee.count({ where: { tenantId } });
      const employeeNumber = `EMP-${(count + 1).toString().padStart(5, '0')}`;

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

  async getEmployeeById(tenantId: string, employeeId: string) {
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

  async getLicensesByEmployee(tenantId: string, employeeId: string) {
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

  async getDepartments(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }
}
