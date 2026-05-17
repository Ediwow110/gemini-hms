import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { HrService } from './hr.service';
import {
  CreateEmployeeDto,
  CreateDepartmentDto,
  CreatePayslipDto,
  UpdateEmployeeStatusDto,
  CreateLeaveRequestDto,
  CreateLicenseRecordDto,
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

  @Get('employees/:id')
  @Roles(
    'Super Admin',
    'Branch Admin',
    'HR Manager',
    'HR Staff',
    'Branch Manager',
  )
  getEmployeeById(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.hrService.getEmployeeById(tenantId, id);
  }

  @Patch('employees/:id/status')
  @Roles('Super Admin', 'HR Manager', 'HR Staff')
  updateEmployeeStatus(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser() user: AuthTypes.RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeStatusDto,
  ) {
    return this.hrService.updateEmployeeStatus(
      tenantId,
      userId,
      id,
      dto.status,
      user,
    );
  }

  @Post('leave-requests')
  @Roles(
    'Super Admin',
    'HR Manager',
    'HR Staff',
    'Branch Admin',
    'Doctor',
    'Nurse',
  )
  createLeaveRequest(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.hrService.createLeaveRequest(tenantId, userId, dto);
  }

  @Patch('leave-requests/:id/approve')
  @Roles('Super Admin', 'HR Manager', 'HR Staff', 'Branch Admin')
  approveLeaveRequest(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser() user: AuthTypes.RequestUser,
    @Param('id') id: string,
  ) {
    return this.hrService.approveLeaveRequest(tenantId, userId, id, user);
  }

  @Patch('leave-requests/:id/reject')
  @Roles('Super Admin', 'HR Manager', 'HR Staff', 'Branch Admin')
  rejectLeaveRequest(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser() user: AuthTypes.RequestUser,
    @Param('id') id: string,
  ) {
    return this.hrService.rejectLeaveRequest(tenantId, userId, id, user);
  }

  @Post('licenses')
  @Roles('Super Admin', 'HR Manager', 'HR Staff')
  createLicenseRecord(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateLicenseRecordDto,
  ) {
    return this.hrService.createLicenseRecord(tenantId, userId, dto);
  }

  @Get('licenses/:employeeId')
  @Roles(
    'Super Admin',
    'Branch Admin',
    'HR Manager',
    'HR Staff',
    'Branch Manager',
  )
  getLicensesByEmployee(
    @GetUser('tenantId') tenantId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.hrService.getLicensesByEmployee(tenantId, employeeId);
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
