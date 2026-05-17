import { Controller, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportExportDto } from './dto/create-export.dto';
import { ApproveExportDto } from './dto/approve-export.dto';
import { RejectExportDto } from './dto/reject-export.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(PermissionsGuard)
@Controller('api/v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('exports')
  @RequirePermissions('report.export')
  async createExport(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string | undefined,
    @GetUser('userId') userId: string,
    @Body() dto: CreateReportExportDto,
  ) {
    return this.reportsService.createExport(tenantId, branchId, userId, dto);
  }

  @Post('exports/:exportId/approve')
  @RequirePermissions('report.export', 'approval.request.process')
  async approveExport(
    @Param('exportId') exportId: string,
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: ApproveExportDto,
  ) {
    return this.reportsService.approveExport(tenantId, userId, exportId, dto);
  }

  @Post('exports/:exportId/reject')
  @RequirePermissions('report.export', 'approval.request.process')
  async rejectExport(
    @Param('exportId') exportId: string,
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: RejectExportDto,
  ) {
    return this.reportsService.rejectExport(tenantId, userId, exportId, dto);
  }
}
