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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  @RequirePermissions('approval.request.create')
  create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateApprovalRequestDto,
  ) {
    return this.approvalsService.createRequest(tenantId, userId, dto);
  }

  @Get()
  @RequirePermissions('approval.request.view')
  findAll(@GetUser('tenantId') tenantId: string) {
    return this.approvalsService.getRequests(tenantId);
  }

  @Patch(':id/approve')
  @RequirePermissions('approval.request.process')
  approve(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: ProcessApprovalRequestDto,
  ) {
    return this.approvalsService.processRequest(
      tenantId,
      userId,
      id,
      'APPROVED',
      dto,
    );
  }

  @Patch(':id/reject')
  @RequirePermissions('approval.request.process')
  reject(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: ProcessApprovalRequestDto,
  ) {
    return this.approvalsService.processRequest(
      tenantId,
      userId,
      id,
      'REJECTED',
      dto,
    );
  }
}
