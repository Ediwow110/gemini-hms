import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ExportReportDto, SalesSummaryQueryDto } from './dto/reports.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard, BranchGuard)
@Controller('api/v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @RequirePermissions('report.view')
  @RequireBranchContext()
  getSalesSummary(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @Query() query: SalesSummaryQueryDto,
  ) {
    return this.reportsService.getSalesSummary(tenantId, branchId, query);
  }

  @Post('export')
  @RequirePermissions('report.export')
  @RequireBranchContext()
  exportReport(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @GetUser('userId') userId: string,
    @GetUser('permissions') permissions: string[],
    @Body() dto: ExportReportDto,
  ) {
    const hasUnmaskedAccess = permissions.includes('report.view.unmasked');
    return this.reportsService.exportReport(
      tenantId,
      branchId,
      userId,
      dto,
      hasUnmaskedAccess,
    );
  }
}
