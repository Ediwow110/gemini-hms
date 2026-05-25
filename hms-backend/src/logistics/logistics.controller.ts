import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import {
  CreateShipmentDto,
  UpdateShipmentStatusDto,
  CreateDeliveryJobDto,
  UpdateDeliveryJobStatusDto,
} from './dto/logistics.dto';

@Controller('logistics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Post('shipments')
  @RequirePermissions('fulfillment.update_status')
  async createShipment(@Req() req: any, @Body() dto: CreateShipmentDto) {
    return this.logisticsService.createShipment(
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }

  @Get('shipments')
  @RequirePermissions('fulfillment.view')
  async findAllShipments(@Req() req: any) {
    return this.logisticsService.findAllShipments(req.user.tenantId);
  }

  @Get('shipments/:id')
  @RequirePermissions('fulfillment.view')
  async findShipment(@Req() req: any, @Param('id') id: string) {
    return this.logisticsService.findShipment(req.user.tenantId, id);
  }

  @Patch('shipments/:id/status')
  @RequirePermissions('fulfillment.update_status')
  async updateShipmentStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
  ) {
    return this.logisticsService.updateShipmentStatus(
      req.user.tenantId,
      req.user.userId,
      id,
      dto,
    );
  }

  @Post('delivery-jobs')
  @RequirePermissions('field_service.job.assign')
  async createDeliveryJob(@Req() req: any, @Body() dto: CreateDeliveryJobDto) {
    return this.logisticsService.createDeliveryJob(
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }

  @Patch('delivery-jobs/:id/status')
  @RequirePermissions('field_service.job.update')
  async updateDeliveryJobStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryJobStatusDto,
  ) {
    return this.logisticsService.updateDeliveryJobStatus(
      req.user.tenantId,
      req.user.userId,
      id,
      dto,
    );
  }

  @Get('technician/jobs')
  @RequirePermissions('field_service.job.view')
  async findTechnicianJobs(@Req() req: any) {
    return this.logisticsService.findTechnicianJobs(
      req.user.tenantId,
      req.user.userId,
    );
  }
}
