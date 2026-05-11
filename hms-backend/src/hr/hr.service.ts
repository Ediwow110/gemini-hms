import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEmployeeDto,
  CreateDepartmentDto,
  CreatePayslipDto,
} from './dto/hr.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class HrService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

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
  ) {
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
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, tenantId },
      include: {
        employeeBranches: {
          where: { isPrimary: true, isActive: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.employeeBranches.length === 0) {
      throw new BadRequestException(
        'Employee has no active primary branch assignment',
      );
    }

    if (employee.employeeBranches.length > 1) {
      throw new BadRequestException(
        'Employee has multiple active primary branch assignments',
      );
    }

    const branchId = employee.employeeBranches[0].branchId;
    const basicSalary = Number(employee.salary);
    const netSalary = basicSalary + dto.totalAllowances - dto.totalDeductions;

    const payslip = await this.prisma.payslip.create({
      data: {
        tenantId,
        branchId,
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

  async getEmployees(tenantId: string) {
    return this.prisma.employee.findMany({
      where: { tenantId },
      include: { department: true },
      orderBy: { lastName: 'asc' },
    });
  }

  async getDepartments(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }
}
