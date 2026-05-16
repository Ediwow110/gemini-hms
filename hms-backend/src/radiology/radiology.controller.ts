import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RadiologyService } from './radiology.service';
import { CreateRadiologyOrderDto } from './dto/create-radiology-order.dto';
import { DraftRadiologyReportDto } from './dto/draft-radiology-report.dto';
import { AmendRadiologyReportDto } from './dto/amend-radiology-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('radiology')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RadiologyController {
  constructor(private readonly radiologyService: RadiologyService) {}

  @Post('orders')
  @RequirePermissions('radiology.order.create')
  async createOrder(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateRadiologyOrderDto,
  ) {
    return this.radiologyService.createOrder(
      req.user.tenantId,
      req.user.userId!,
      dto,
    );
  }

  @Post('orders/:id/report')
  @RequirePermissions('radiology.report.write')
  async draftReport(
    @Request() req: AuthenticatedRequest,
    @Param('id') orderId: string,
    @Body() dto: DraftRadiologyReportDto,
  ) {
    return this.radiologyService.draftReport(
      req.user.tenantId,
      req.user.userId!,
      orderId,
      dto,
    );
  }

  @Patch('reports/:id/approve')
  @RequirePermissions('radiology.report.approve')
  async approveReport(
    @Request() req: AuthenticatedRequest,
    @Param('id') reportId: string,
  ) {
    return this.radiologyService.approveReport(
      req.user.tenantId,
      req.user.userId!,
      reportId,
    );
  }

  @Post('reports/:id/amend')
  @RequirePermissions('radiology.report.write') // Amendment often requires the same write permission
  async amendReport(
    @Request() req: AuthenticatedRequest,
    @Param('id') reportId: string,
    @Body() dto: AmendRadiologyReportDto,
  ) {
    return this.radiologyService.amendReport(
      req.user.tenantId,
      req.user.userId!,
      reportId,
      dto,
    );
  }
}
