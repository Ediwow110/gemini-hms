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

  /** Roles that are tenant-wide and bypass branchId requirement in BranchGuard. */
  private static TENANT_WIDE_ROLES = [
    'Super Admin',
    'Compliance Officer',
    'Tenant Admin',
  ];

  private isTenantWideUser(roles: string[] | undefined): boolean {
    if (!roles) return false;
    return roles.some((r) => ApprovalsController.TENANT_WIDE_ROLES.includes(r));
  }

  @Post()
  @RequirePermissions('approval.request.create')
  @RequireBranchContext(['Super Admin', 'Compliance Officer', 'Tenant Admin'])
  create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string | undefined,
    @GetUser('roles') roles: string[] | undefined,
    @Body() dto: CreateApprovalRequestDto,
  ) {
    return this.approvalsService.createRequest(tenantId, userId, {
      ...dto,
      branchId,
    });
  }

  @Get()
  @RequirePermissions('approval.request.view')
  @RequireBranchContext(['Super Admin', 'Compliance Officer', 'Tenant Admin'])
  findAll(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string | undefined,
    @GetUser('roles') roles: string[] | undefined,
  ) {
    return this.approvalsService.getRequests(
      tenantId,
      branchId,
      roles?.includes('Super Admin') ?? false,
      this.isTenantWideUser(roles),
    );
  }

  @Patch(':id/approve')
  @RequirePermissions('approval.request.process')
  @RequireBranchContext(['Super Admin', 'Compliance Officer', 'Tenant Admin'])
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
  @RequireBranchContext(['Super Admin', 'Compliance Officer', 'Tenant Admin'])
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
