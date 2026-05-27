import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import {
  CreateApprovalRequestDto,
  ProcessApprovalRequestDto,
} from './dto/approval.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { SelfApprovalGuard } from '../common/guards/self-approval.guard';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';

@UseGuards(PermissionsGuard, BranchGuard)
@Controller('api/v1/approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  @RequirePermissions('approval.request.create')
  @RequireBranchContext()
  create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Body() dto: CreateApprovalRequestDto,
  ) {
    return this.approvalsService.createRequest(tenantId, userId, {
      ...dto,
      branchId,
    });
  }

  @Get()
  @RequirePermissions('approval.request.view')
  @RequireBranchContext()
  findAll(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string | undefined,
    @GetUser('roles') roles: string[] | undefined,
  ) {
    return this.approvalsService.getRequests(
      tenantId,
      branchId,
      roles?.includes('Super Admin') ?? false,
    );
  }

  @Patch(':id/approve')
  @RequirePermissions('approval.request.process')
  @RequireBranchContext()
  @UseGuards(SelfApprovalGuard)
  approve(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Param('id') id: string,
    @Body() dto: ProcessApprovalRequestDto,
  ) {
    return this.approvalsService.processRequest(
      tenantId,
      userId,
      id,
      'APPROVED',
      dto,
      branchId,
    );
  }

  @Patch(':id/reject')
  @RequirePermissions('approval.request.process')
  @RequireBranchContext()
  reject(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string | undefined,
    @Param('id') id: string,
    @Body() dto: ProcessApprovalRequestDto,
  ) {
    return this.approvalsService.processRequest(
      tenantId,
      userId,
      id,
      'REJECTED',
      dto,
      branchId,
    );
  }
}
