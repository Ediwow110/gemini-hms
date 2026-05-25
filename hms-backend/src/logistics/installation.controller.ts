import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { InstallationService } from './installation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { UpdateInstallationJobStatusDto } from './dto/logistics.dto';

@Controller('logistics/installations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InstallationController {
  constructor(private readonly installationService: InstallationService) {}

  @Get()
  @RequirePermissions('field_service.job.view')
  async findAll(@Req() req: any) {
    return this.installationService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('field_service.job.view')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const job = await this.installationService.findOne(req.user.tenantId, id);
    if (!job) {
      throw new NotFoundException('Installation job not found');
    }
    return job;
  }

  @Patch(':id/status')
  @RequirePermissions('field_service.job.update')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateInstallationJobStatusDto,
  ) {
    return this.installationService.updateStatus(
      req.user.tenantId,
      req.user.userId,
      id,
      dto,
    );
  }
}
