import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ResultService } from './result.service';
import { EncodeResultDto, AmendResultDto } from './dto/result.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { LabResultStatus } from '@prisma/client';

@Controller('lis/results')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  @Post()
  @RequirePermissions('lab.result.encode')
  @RequireBranchContext()
  async encodeResult(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Body() dto: EncodeResultDto,
  ) {
    return this.resultService.encodeResult(tenantId, userId, branchId, dto);
  }

  @Patch(':id/validate')
  @RequirePermissions('lab.result.validate')
  @RequireBranchContext()
  async validateResult(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') resultId: string,
  ) {
    return this.resultService.transitionStatus(
      tenantId,
      userId,
      branchId,
      resultId,
      LabResultStatus.VALIDATED,
      'RESULT_VALIDATED',
    );
  }

  @Patch(':id/approve')
  @RequirePermissions('lab.result.approve')
  @RequireBranchContext()
  async approveResult(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') resultId: string,
  ) {
    return this.resultService.transitionStatus(
      tenantId,
      userId,
      branchId,
      resultId,
      LabResultStatus.APPROVED,
      'RESULT_APPROVED',
    );
  }

  @Patch(':id/release')
  @RequirePermissions('lab.result.release')
  @RequireBranchContext()
  async releaseResult(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') resultId: string,
  ) {
    return this.resultService.transitionStatus(
      tenantId,
      userId,
      branchId,
      resultId,
      LabResultStatus.RELEASED,
      'RESULT_RELEASED',
    );
  }

  @Post(':id/amend')
  @RequirePermissions('lab.result.amend')
  @RequireBranchContext()
  async amendResult(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') resultId: string,
    @Body() dto: AmendResultDto,
  ) {
    return this.resultService.amendResult(
      tenantId,
      userId,
      branchId,
      resultId,
      dto,
    );
  }
}
