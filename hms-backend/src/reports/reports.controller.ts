import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Res,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportExportDto } from './dto/create-export.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { Response } from 'express';

@UseGuards(JwtAuthGuard, PermissionsGuard)
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

  @Get('history')
  @RequirePermissions('report.export')
  async findAll(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string | undefined,
  ) {
    return this.reportsService.findAll(tenantId, branchId);
  }

  @Get('exports/:id/download')
  @RequirePermissions('report.export')
  async download(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.reportsService.getExportFile(tenantId, id);
    res.download(file.path, file.fileName);
  }
}
