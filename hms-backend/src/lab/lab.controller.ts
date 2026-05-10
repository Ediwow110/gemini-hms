import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { LabService } from './lab.service';
import {
  EncodeLabResultDto,
  ApproveLabResultDto,
  AmendLabResultDto,
} from './dto/lab.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/lab')
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Get('worklist')
  @RequirePermissions('lab.result.view')
  getWorklist(@GetUser('tenantId') tenantId: string) {
    return this.labService.getPendingWorklist(tenantId);
  }

  @Get('results/:id')
  @RequirePermissions('lab.result.view')
  findOne(@GetUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.labService.findOne(tenantId, id);
  }

  @Patch('results/:id/encode')
  @RequirePermissions('lab.result.encode')
  encode(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: EncodeLabResultDto,
  ) {
    return this.labService.encodeResult(tenantId, userId, id, dto);
  }

  @Patch('results/:id/approve')
  @RequirePermissions('lab.result.approve')
  approve(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: ApproveLabResultDto,
  ) {
    return this.labService.approveResult(tenantId, userId, id, dto);
  }

  @Post('results/:id/release')
  @RequirePermissions('lab.result.release')
  release(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.labService.releaseResult(tenantId, userId, id);
  }

  @Post('results/:id/amend')
  @RequirePermissions('lab.result.amend')
  amend(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: AmendLabResultDto,
  ) {
    return this.labService.requestAmendment(tenantId, userId, id, dto);
  }
}
