import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { DashboardQueryDto } from '../dto/dashboard-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';

@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin/summary')
  @Roles('Super Admin')
  async getSummary(@Query() query: DashboardQueryDto, @GetUser() user: User) {
    return this.dashboardService.getAdminSummary(query, user.id, user.tenantId);
  }

  @Get('admin/trends')
  @Roles('Super Admin')
  async getTrends(@Query() query: DashboardQueryDto, @GetUser() user: User) {
    return this.dashboardService.getAdminTrends(query, user.tenantId);
  }

  @Get('admin/alerts')
  @Roles('Super Admin')
  async getAlerts(@GetUser() user: User) {
    return this.dashboardService.getAdminAlerts(user.tenantId);
  }

  @Get('admin/top-lists')
  @Roles('Super Admin')
  async getTopLists(@GetUser() user: User) {
    return this.dashboardService.getAdminTopLists(user.tenantId);
  }
}
