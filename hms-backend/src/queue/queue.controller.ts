import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { User } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/queue')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  async listQueue(@Req() req: Request, @Query('branchId') branchId: string) {
    const user = req.user as any;
    const bId = branchId || user.primaryBranchId;
    if (!bId)
      throw new BadRequestException('Branch ID is required to view the queue.');

    return this.queueService.listActiveQueue(user.tenantId, bId);
  }

  @Post('join')
  async joinQueue(
    @Req() req: Request,
    @Body()
    body: {
      patientId: string;
      serviceType: string;
      category?: string;
      branchId: string;
    },
  ) {
    const user = req.user as any;
    const userBranchId = user.branchId || user.primaryBranchId;
    if (body.branchId && userBranchId && body.branchId !== userBranchId) {
      throw new ForbiddenException('Branch mismatch.');
    }
    return this.queueService.joinQueue(
      user.tenantId,
      body.branchId,
      {
        patientId: body.patientId,
        serviceType: body.serviceType,
        category: body.category || 'ROUTINE',
      },
      user.userId || user.id,
    );
  }

  @Patch('call-next')
  async callNext(
    @Req() req: Request,
    @Query('branchId') branchId: string,
    @Query('serviceType') serviceType: string,
  ) {
    const user = req.user as any;
    const bId = branchId || user.primaryBranchId;
    if (!bId) throw new BadRequestException('Branch ID is required.');

    return this.queueService.callNext(user.tenantId, bId, serviceType);
  }

  @Patch(':id/complete')
  async completeEntry(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.queueService.completeEntry(user.tenantId, id);
  }

  @Get('stats')
  async getStats(@Req() req: Request, @Query('branchId') branchId: string) {
    const user = req.user as any;
    const bId = branchId || user.primaryBranchId;
    if (!bId) throw new BadRequestException('Branch ID is required.');

    return this.queueService.getQueueStats(user.tenantId, bId);
  }
}
