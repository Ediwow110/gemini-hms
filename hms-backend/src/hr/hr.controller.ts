import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { HrService } from './hr.service';
import { CreateEmployeeDto, CreateDepartmentDto, CreatePayslipDto } from './dto/hr.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('departments')
  @Roles('Super Admin', 'Branch Admin', 'HR')
  getDepartments(@GetUser('tenantId') tenantId: string) {
    return this.hrService.getDepartments(tenantId);
  }

  @Post('departments')
  @Roles('Super Admin', 'Branch Admin', 'HR')
  createDepartment(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateDepartmentDto
  ) {
    return this.hrService.createDepartment(tenantId, userId, dto);
  }

  @Get('employees')
  @Roles('Super Admin', 'Branch Admin', 'HR')
  getEmployees(@GetUser('tenantId') tenantId: string) {
    return this.hrService.getEmployees(tenantId);
  }

  @Post('employees')
  @Roles('Super Admin', 'Branch Admin', 'HR')
  createEmployee(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateEmployeeDto
  ) {
    return this.hrService.createEmployee(tenantId, userId, dto);
  }

  @Post('payroll/generate')
  @Roles('Super Admin', 'Branch Admin', 'HR')
  generatePayslip(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreatePayslipDto
  ) {
    return this.hrService.generatePayslip(tenantId, userId, dto);
  }
}
