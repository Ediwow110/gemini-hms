import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEmployeeDto,
  CreateDepartmentDto,
  CreatePayslipDto,
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

    if (this.isBranchScopedHr(roles)) {
      if (!user.branchId) {
        throw new BadRequestException('Branch context required');
      }
      if (dto.primaryBranchId !== user.branchId) {
        throw new ForbiddenException(
          'Branch Admin can only create employees for their own branch',
        );
      }
    } else if (!this.isTenantWideHr(roles)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // 1. Generate employee number
    const count = await this.prisma.employee.count({ where: { tenantId } });
    const employeeNumber = `EMP-${(count + 1).toString().padStart(5, '0')}`;

    // 2. Create Employee with primary branch assignment
    const employee = await this.prisma.employee.create({
      data: {
        tenantId,
        employeeNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        jobTitle: dto.jobTitle,
        departmentId: dto.departmentId,
        joiningDate: new Date(dto.joiningDate),
        salary: dto.salary,
        status: 'ACTIVE',
        employeeBranches: {
          create: {
            tenantId,
            branchId: dto.primaryBranchId,
            isPrimary: true,
            isActive: true,
          },
        },
      },
      include: {
        employeeBranches: true,
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
      include: {
        employeeBranches: {
          where: { isActive: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    let targetBranchId: string;

    if (this.isBranchScopedHr(roles)) {
      if (!user.branchId) {
        throw new BadRequestException('Branch context required');
      }
      const branchAssignment = employee.employeeBranches.find(
        (eb) => eb.branchId === user.branchId,
      );
      if (!branchAssignment) {
        throw new ForbiddenException(
          'Branch Admin can only generate payslips for employees in their branch',
        );
      }
      targetBranchId = user.branchId;
    } else if (this.isTenantWideHr(roles)) {
      const primaryBranch = employee.employeeBranches.find(
        (eb) => eb.isPrimary,
      );
      if (!primaryBranch) {
        throw new BadRequestException(
          'Employee has no active primary branch assignment',
        );
      }
      targetBranchId = primaryBranch.branchId;
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    const basicSalary = Number(employee.salary);
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

    if (this.isTenantWideHr(roles)) {
      return this.prisma.employee.findMany({
        where: { tenantId },
        include: { department: true, employeeBranches: true },
        orderBy: { lastName: 'asc' },
      });
    }

    if (this.isBranchScopedHr(roles)) {
      if (!user.branchId) {
        throw new BadRequestException('Branch context required');
      }
      return this.prisma.employee.findMany({
        where: {
          tenantId,
          employeeBranches: {
            some: {
              branchId: user.branchId,
              isActive: true,
            },
          },
        },
        include: { department: true, employeeBranches: true },
        orderBy: { lastName: 'asc' },
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
