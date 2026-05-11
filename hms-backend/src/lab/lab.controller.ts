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
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard, BranchGuard)
@Controller('api/v1/lab')
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Get('worklist')
  @RequirePermissions('lab.result.view')
  @RequireBranchContext()
  getWorklist(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
  ) {
    return this.labService.getPendingWorklist(tenantId, branchId);
  }

  @Get('results/:id')
  @RequirePermissions('lab.result.view')
  @RequireBranchContext()
  findOne(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') id: string,
  ) {
    return this.labService.findOne(tenantId, branchId, id);
  }

  @Patch('results/:id/encode')
  @RequirePermissions('lab.result.encode')
  @RequireBranchContext()
  encode(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') id: string,
    @Body() dto: EncodeLabResultDto,
  ) {
    return this.labService.encodeResult(tenantId, userId, branchId, id, dto);
  }

  @Patch('results/:id/approve')
  @RequirePermissions('lab.result.approve')
  @RequireBranchContext()
  approve(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') id: string,
    @Body() dto: ApproveLabResultDto,
  ) {
    return this.labService.approveResult(tenantId, userId, branchId, id, dto);
  }

  @Post('results/:id/release')
  @RequirePermissions('lab.result.release')
  @RequireBranchContext()
  release(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') id: string,
  ) {
    return this.labService.releaseResult(tenantId, userId, branchId, id);
  }

  @Post('results/:id/amend')
  @RequirePermissions('lab.result.amend')
  @RequireBranchContext()
  amend(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') id: string,
    @Body() dto: AmendLabResultDto,
  ) {
    return this.labService.requestAmendment(
      tenantId,
      userId,
      branchId,
      id,
      dto,
    );
  }
}
