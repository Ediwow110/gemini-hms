import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { RadiologyService } from './radiology.service';
import { FinalizeRadiologyReportDto } from './dto/finalize-radiology-report.dto';

@Controller('api/v1/radiology')
@UseGuards(PermissionsGuard, BranchGuard)
export class RadiologyController {
  constructor(private readonly radiologyService: RadiologyService) {}

  @Get('orders')
  @RequirePermissions('lab.result.view')
  @RequireBranchContext()
  listOrders(@GetUser() user: RequestUser) {
    return this.radiologyService.listImagingOrders(user);
  }

  @Post('orders/:id/finalize')
  @RequirePermissions('lab.result.encode')
  @RequireBranchContext()
  finalizeOrder(
    @Param('id') id: string,
    @Body() dto: FinalizeRadiologyReportDto,
    @GetUser() user: RequestUser,
  ) {
    return this.radiologyService.finalizeReport(user, id, dto);
  }
}