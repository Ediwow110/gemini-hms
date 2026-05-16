import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeStatusDto,
  ClockInDto,
} from './dto/hr.dto';
import { EmployeeStatus, Prisma } from '@prisma/client';

@Injectable()
export class HrService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createEmployee(
    tenantId: string,
    branchId: string,
    userId: string,
    dto: CreateEmployeeDto,
  ) {
    // Check if employee ID number already exists for this tenant
    const existing = await this.prisma.employee.findUnique({
      where: {
        tenantId_employeeIdNumber: {
          tenantId,
          employeeIdNumber: dto.employeeIdNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Employee ID number already exists');
    }

    if (dto.userId) {
      const existingUser = await this.prisma.user.findFirst({
        where: { id: dto.userId, tenantId },
      });
      if (!existingUser) {
        throw new NotFoundException('Linked user not found');
      }

      const userLinked = await this.prisma.employee.findUnique({
        where: { userId: dto.userId },
      });
      if (userLinked) {
        throw new ConflictException(
          'User is already linked to another employee',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          tenantId,
          branchId,
          userId: dto.userId,
          departmentId: dto.departmentId,
          employeeIdNumber: dto.employeeIdNumber,
          firstName: dto.firstName,
          lastName: dto.lastName,
          jobTitle: dto.jobTitle,
          hireDate: new Date(dto.hireDate),
          salary: new Prisma.Decimal(dto.salary),
          status: EmployeeStatus.ACTIVE,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'EMPLOYEE_CREATED',
          recordType: 'Employee',
          recordId: employee.id,
          newValues: employee,
        },
        tx,
        branchId,
      );

      return employee;
    });
  }

  async updateEmployeeStatus(
    tenantId: string,
    branchId: string,
    userId: string,
    employeeId: string,
    dto: UpdateEmployeeStatusDto,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const isOffboarding =
      dto.status === EmployeeStatus.TERMINATED ||
      dto.status === EmployeeStatus.SUSPENDED;

    return this.prisma.$transaction(async (tx) => {
      const updatedEmployee = await tx.employee.update({
        where: { id: employeeId },
        data: {
          status: dto.status,
          terminationDate:
            dto.status === EmployeeStatus.TERMINATED
              ? new Date()
              : employee.terminationDate,
          updatedBy: userId,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: isOffboarding
            ? 'EMPLOYEE_TERMINATED'
            : 'EMPLOYEE_STATUS_UPDATED',
          recordType: 'Employee',
          recordId: employee.id,
          newValues: { status: dto.status, reason: dto.reason },
        },
        tx,
        branchId,
      );

      if (isOffboarding && employee.userId) {
        await tx.user.update({
          where: { id: employee.userId },
          data: {
            isActive: false,
            deactivatedAt: new Date(),
            deactivatedReason: `Employee ${dto.status}: ${dto.reason || 'No reason provided'}`,
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'USER_ACCESS_REVOKED',
            recordType: 'User',
            recordId: employee.userId,
            newValues: { isActive: false },
          },
          tx,
          branchId,
        );
      }

      return updatedEmployee;
    });
  }

  async clockIn(
    tenantId: string,
    branchId: string,
    userId: string,
    dto: ClockInDto,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, tenantId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.status !== EmployeeStatus.ACTIVE) {
      throw new ForbiddenException(
        `Employee is not active (Status: ${employee.status})`,
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingLog = await this.prisma.attendanceLog.findFirst({
      where: {
        employeeId: dto.employeeId,
        date: today,
      },
    });

    if (existingLog) {
      throw new ConflictException('Employee already clocked in today');
    }

    return this.prisma.$transaction(async (tx) => {
      const log = await tx.attendanceLog.create({
        data: {
          tenantId,
          branchId,
          employeeId: dto.employeeId,
          date: today,
          clockIn: new Date(),
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'EMPLOYEE_CLOCK_IN',
          recordType: 'AttendanceLog',
          recordId: log.id,
          newValues: log,
        },
        tx,
        branchId,
      );

      return log;
    });
  }

  async getEmployees(tenantId: string, branchId: string) {
    return this.prisma.employee.findMany({
      where: { tenantId, branchId },
      include: {
        department: true,
        user: { select: { email: true, isActive: true } },
      },
      orderBy: { lastName: 'asc' },
    });
  }
}
