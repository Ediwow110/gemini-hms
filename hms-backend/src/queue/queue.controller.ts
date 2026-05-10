import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JoinQueueDto, UpdateQueueStatusDto } from './dto/queue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('join')
  @RequirePermissions('queue.manage')
  join(@GetUser('tenantId') tenantId: string, @Body() dto: JoinQueueDto) {
    // Open endpoint for public kiosk or reception
    return this.queueService.joinQueue(tenantId, dto);
  }

  @Get('display')
  @RequirePermissions('queue.view')
  getDisplay(@GetUser('tenantId') tenantId: string, @Query('branchId') branchId: string) {
    // Polling endpoint for TV display
    return this.queueService.getActiveDisplay(tenantId, branchId);
  }

  @Get('worklist')
  @RequirePermissions('queue.view')
  getWorklist(@GetUser('tenantId') tenantId: string, @Query('serviceType') serviceType: string) {
    return this.queueService.getWorklist(tenantId, serviceType);
  }

  @Patch(':id/status')
  @RequirePermissions('queue.manage')
  updateStatus(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQueueStatusDto
  ) {
    return this.queueService.updateStatus(tenantId, userId, id, dto);
  }
}
