import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HrService } from './hr.service';
import {
  CreateEmployeeDto,
  CreateDepartmentDto,
  CreatePayslipDto,
  ListPayslipsFiltersDto,
  UpdateEmployeeStatusDto,
  CreateLeaveRequestDto,
  CreateLicenseRecordDto,
} from './dto/hr.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import * as AuthTypes from '../common/types/authenticated-request.type';

/**
 * HR Controller — permission-based authorization.
 *
 * Uses PermissionsGuard so that custom roles created via the RolesPermissionsPage
 * UI work correctly for HR endpoints. The permission catalog includes granular
 * permissions that prevent privilege expansion:
 *
 * - `hr.employee.status.change` (PRIVILEGED): only Super Admin, HR Manager, HR
 *   Staff. Branch Admin does NOT have this — preserving the intentional
 *   exclusion that was previously enforced via @Roles.
 * - `hr.leave.request.create_own` / `hr.leave.request.view`: granted to Doctor
 *   and Nurse for self-service leave requests.
 * - `hr.leave.request.approve`: granted to Super Admin, HR Manager, HR Staff,
 *   Branch Admin.
 */
@UseGuards(PermissionsGuard)
@Controller('api/v1/hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('departments')
  @RequirePermissions('hr.employee.view')
  getDepartments(@GetUser('tenantId') tenantId: string) {
    return this.hrService.getDepartments(tenantId);
  }

  @Post('departments')
  @RequirePermissions('hr.employee.manage')
  createDepartment(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.hrService.createDepartment(tenantId, userId, dto);
  }

  @Get('employees')
  @RequirePermissions('hr.employee.view')
  getEmployees(
    @GetUser('tenantId') tenantId: string,
    @GetUser() user: AuthTypes.RequestUser,
  ) {
    return this.hrService.getEmployees(tenantId, user);
  }

  @Get('assignments')
  @RequirePermissions('hr.employee.view')
  getAssignments(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @GetUser() user: AuthTypes.RequestUser,
  ) {
    return this.hrService.getAssignments(tenantId, branchId, user);
  }

  @Get('attendance')
  @RequirePermissions('hr.employee.view')
  getAttendance(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @GetUser() user: AuthTypes.RequestUser,
  ) {
    return this.hrService.getAttendance(tenantId, branchId, user);
  }

  @Post('employees')
  @RequirePermissions('hr.employee.manage')
  createEmployee(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser() user: AuthTypes.RequestUser,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.hrService.createEmployee(tenantId, userId, dto, user);
  }

  @Get('employees/:id')
  @RequirePermissions('hr.employee.view')
  getEmployeeById(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @GetUser() user: AuthTypes.RequestUser,
  ) {
    return this.hrService.getEmployeeById(tenantId, id, user);
  }

  @Patch('employees/:id/status')
  @RequirePermissions('hr.employee.status.change')
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
  @RequirePermissions('hr.leave.request.create_own')
  createLeaveRequest(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.hrService.createLeaveRequest(tenantId, userId, dto);
  }

  @Get('leave-requests')
  @RequirePermissions('hr.leave.request.view')
  getLeaveRequests(
    @GetUser('tenantId') tenantId: string,
    @GetUser() user: AuthTypes.RequestUser,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.hrService.getLeaveRequests(tenantId, user, {
      status,
      employeeId,
    });
  }

  @Patch('leave-requests/:id/approve')
  @RequirePermissions('hr.leave.request.approve')
  approveLeaveRequest(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser() user: AuthTypes.RequestUser,
    @Param('id') id: string,
  ) {
    return this.hrService.approveLeaveRequest(tenantId, userId, id, user);
  }

  @Patch('leave-requests/:id/reject')
  @RequirePermissions('hr.leave.request.approve')
  rejectLeaveRequest(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser() user: AuthTypes.RequestUser,
    @Param('id') id: string,
  ) {
    return this.hrService.rejectLeaveRequest(tenantId, userId, id, user);
  }

  @Post('licenses')
  @RequirePermissions('hr.employee.manage')
  createLicenseRecord(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateLicenseRecordDto,
  ) {
    return this.hrService.createLicenseRecord(tenantId, userId, dto);
  }

  @Get('licenses/:employeeId')
  @RequirePermissions('hr.employee.view')
  getLicensesByEmployee(
    @GetUser('tenantId') tenantId: string,
    @Param('employeeId') employeeId: string,
    @GetUser() user: AuthTypes.RequestUser,
  ) {
    return this.hrService.getLicensesByEmployee(tenantId, employeeId, user);
  }

  @Post('payroll/generate')
  @RequirePermissions('hr.payroll.view')
  generatePayslip(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser() user: AuthTypes.RequestUser,
    @Body() dto: CreatePayslipDto,
  ) {
    return this.hrService.generatePayslip(tenantId, userId, dto, user);
  }

  @Get('payslips')
  @RequirePermissions('hr.payroll.view')
  listPayslips(
    @GetUser('tenantId') tenantId: string,
    @GetUser() user: AuthTypes.RequestUser,
    @Query() filters: ListPayslipsFiltersDto,
  ) {
    return this.hrService.listPayslips(tenantId, user, filters);
  }
}
