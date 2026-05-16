import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CashierService } from './cashier.service';
import { OpenSessionDto, CloseSessionDto } from './dto/session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('cashier/sessions')
@UseGuards(JwtAuthGuard, PermissionsGuard, BranchGuard)
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  @Post('open')
  @RequirePermissions('cashier.session.open')
  @RequireBranchContext()
  async openSession(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Body() dto: OpenSessionDto,
  ) {
    return this.cashierService.openSession(tenantId, userId, branchId, dto);
  }

  @Patch(':id/close')
  @RequirePermissions('cashier.session.close')
  @RequireBranchContext()
  async closeSession(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') sessionId: string,
    @Body() dto: CloseSessionDto,
  ) {
    return this.cashierService.closeSession(
      tenantId,
      userId,
      branchId,
      sessionId,
      dto,
    );
  }

  @Get('active')
  @RequirePermissions('cashier.session.view')
  @RequireBranchContext()
  async getActiveSession(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
  ) {
    return this.cashierService.getActiveSession(tenantId, userId, branchId);
  }
}
