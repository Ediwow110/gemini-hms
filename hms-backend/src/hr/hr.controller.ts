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
  UpdateEmployeeStatusDto,
  ClockInDto,
} from './dto/hr.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard, BranchGuard)
@Controller('api/v1/hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('employees')
  @RequirePermissions('hr.employee.view')
  @RequireBranchContext()
  getEmployees(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
  ) {
    return this.hrService.getEmployees(tenantId, branchId);
  }

  @Post('employees')
  @RequirePermissions('hr.employee.manage')
  @RequireBranchContext()
  createEmployee(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.hrService.createEmployee(tenantId, branchId, userId, dto);
  }

  @Patch('employees/:id/status')
  @RequirePermissions('hr.employee.manage')
  @RequireBranchContext()
  updateEmployeeStatus(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeStatusDto,
  ) {
    return this.hrService.updateEmployeeStatus(
      tenantId,
      branchId,
      userId,
      id,
      dto,
    );
  }

  @Post('attendance/clock-in')
  @RequirePermissions('hr.attendance.manage')
  @RequireBranchContext()
  clockIn(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @GetUser('userId') userId: string,
    @Body() dto: ClockInDto,
  ) {
    return this.hrService.clockIn(tenantId, branchId, userId, dto);
  }
}
