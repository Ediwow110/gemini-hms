import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { UserLifecycleReasonDto } from './dto/user-lifecycle.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('users/:id/deactivate')
  @RequirePermissions('admin.role.change')
  async deactivateUser(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.deactivateUser(actor, targetUserId, dto.reason);
  }

  @Post('users/:id/activate')
  @RequirePermissions('admin.role.change')
  async activateUser(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.activateUser(actor, targetUserId, dto.reason);
  }
}
