import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { JoinQueueDto, UpdateQueueStatusDto } from './dto/queue.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';

@UseGuards(PermissionsGuard, BranchGuard)
@Controller('api/v1/queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('join')
  @RequirePermissions('queue.manage')
  @RequireBranchContext()
  join(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Body() dto: JoinQueueDto,
  ) {
    // Open endpoint for public kiosk or reception
    return this.queueService.joinQueue(tenantId, branchId, userId, dto);
  }

  @Get('display')
  @RequirePermissions('queue.view')
  @RequireBranchContext()
  getDisplay(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
  ) {
    // Polling endpoint for TV display - branch context enforced
    return this.queueService.getActiveDisplay(tenantId, branchId);
  }

  @Get('worklist')
  @RequirePermissions('queue.view')
  @RequireBranchContext()
  getWorklist(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @Query('serviceType') serviceType: string,
  ) {
    return this.queueService.getWorklist(tenantId, branchId, serviceType);
  }

  @Patch(':id/status')
  @RequirePermissions('queue.manage')
  @RequireBranchContext()
  updateStatus(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQueueStatusDto,
  ) {
    return this.queueService.updateStatus(tenantId, userId, branchId, id, dto);
  }
}
