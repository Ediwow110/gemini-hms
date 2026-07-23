import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InstallationService } from './installation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';
import { UpdateInstallationJobStatusDto } from './dto/logistics.dto';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('api/v1/logistics/installations')
@UseGuards(JwtAuthGuard, PermissionsGuard, BranchGuard)
@RequireBranchContext()
export class InstallationController {
  constructor(private readonly installationService: InstallationService) {}

  @Get()
  @RequirePermissions('field_service.job.view')
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.installationService.findAll(
      req.user.tenantId,
      req.user.branchId!,
    );
  }

  @Get(':id')
  @RequirePermissions('field_service.job.view')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.installationService.findOne(
      req.user.tenantId,
      req.user.branchId!,
      id,
    );
  }

  @Patch(':id/status')
  @RequirePermissions('field_service.installation.update')
  async updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateInstallationJobStatusDto,
  ) {
    return this.installationService.updateStatus(
      req.user.tenantId,
      req.user.branchId!,
      req.user.userId!,
      id,
      dto,
    );
  }
}
