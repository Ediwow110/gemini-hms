import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { HrService } from './hr.service';
import {
  CreateEmployeeDto,
  CreateDepartmentDto,
  CreatePayslipDto,
} from './dto/hr.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import * as AuthTypes from '../common/types/authenticated-request.type';

@UseGuards(RolesGuard)
@Controller('api/v1/hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('departments')
  @Roles(
    'Super Admin',
    'Branch Admin',
    'HR Manager',
    'HR Staff',
    'Branch Manager',
  )
  getDepartments(@GetUser('tenantId') tenantId: string) {
    return this.hrService.getDepartments(tenantId);
  }

  @Post('departments')
  @Roles('Super Admin', 'HR Manager', 'HR Staff')
  createDepartment(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.hrService.createDepartment(tenantId, userId, dto);
  }

  @Get('employees')
  @Roles(
    'Super Admin',
    'Branch Admin',
    'HR Manager',
    'HR Staff',
    'Branch Manager',
  )
  getEmployees(
    @GetUser('tenantId') tenantId: string,
    @GetUser() user: AuthTypes.RequestUser,
  ) {
    return this.hrService.getEmployees(tenantId, user);
  }

  @Post('employees')
  @Roles('Super Admin', 'Branch Admin', 'HR Manager', 'HR Staff')
  createEmployee(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser() user: AuthTypes.RequestUser,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.hrService.createEmployee(tenantId, userId, dto, user);
  }

  @Post('payroll/generate')
  @Roles('Super Admin', 'Branch Admin', 'HR Manager', 'HR Staff')
  generatePayslip(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser() user: AuthTypes.RequestUser,
    @Body() dto: CreatePayslipDto,
  ) {
    return this.hrService.generatePayslip(tenantId, userId, dto, user);
  }
}
