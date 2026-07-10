import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';
import {
  CallNextQueueQueryDto,
  JoinQueueDto,
  QueueBranchQueryDto,
} from './dto/queue.dto';

@Controller('api/v1/queue')
@UseGuards(PermissionsGuard, BranchGuard)
@RequireBranchContext()
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @RequirePermissions('queue.view')
  async listQueue(
    @GetUser() user: RequestUser,
    @Query() query: QueueBranchQueryDto,
  ) {
    const branchId = this.resolveBranchId(user, query.branchId);
    return this.queueService.listActiveQueue(user.tenantId, branchId);
  }

  @Post('join')
  @RequirePermissions('queue.manage')
  async joinQueue(@GetUser() user: RequestUser, @Body() body: JoinQueueDto) {
    const branchId = this.resolveBranchId(user, body.branchId);
    return this.queueService.joinQueue(
      user.tenantId,
      branchId,
      {
        patientId: body.patientId,
        serviceType: body.serviceType,
        category: body.category ?? 'ROUTINE',
      },
      this.requireUserId(user),
    );
  }

  @Patch('call-next')
  @RequirePermissions('queue.manage')
  async callNext(
    @GetUser() user: RequestUser,
    @Query() query: CallNextQueueQueryDto,
  ) {
    const branchId = this.resolveBranchId(user, query.branchId);
    return this.queueService.callNext(
      user.tenantId,
      branchId,
      query.serviceType,
      this.requireUserId(user),
    );
  }

  @Patch(':id/complete')
  @RequirePermissions('queue.manage')
  async completeEntry(
    @GetUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: QueueBranchQueryDto,
  ) {
    const branchId = this.resolveBranchId(user, query.branchId);
    return this.queueService.completeEntry(
      user.tenantId,
      branchId,
      id,
      this.requireUserId(user),
    );
  }

  @Get('stats')
  @RequirePermissions('queue.view')
  async getStats(
    @GetUser() user: RequestUser,
    @Query() query: QueueBranchQueryDto,
  ) {
    const branchId = this.resolveBranchId(user, query.branchId);
    return this.queueService.getQueueStats(user.tenantId, branchId);
  }

  private resolveBranchId(
    user: RequestUser,
    requestedBranchId?: string,
  ): string {
    const branchId = requestedBranchId ?? user.branchId;
    if (!branchId) {
      throw new BadRequestException('Branch ID is required.');
    }
    return branchId;
  }

  private requireUserId(user: RequestUser): string {
    if (!user.userId) {
      throw new BadRequestException('Authenticated user ID is required.');
    }
    return user.userId;
  }
}
