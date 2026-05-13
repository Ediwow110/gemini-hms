import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';
import {
  AssignUserRoleDto,
  CreateCustomRoleDto,
  CreateUserDto,
  GrantRolePermissionDto,
  PrivilegedRoleRequestDto,
  UpdateCustomRoleDto,
  UserLifecycleReasonDto,
} from './dto/user-lifecycle.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('users')
  @RequirePermissions('admin.role.change')
  async createUser(@GetUser() actor: RequestUser, @Body() dto: CreateUserDto) {
    return this.adminService.createUser(actor, dto);
  }

  @Post('roles')
  @RequirePermissions('admin.role.change')
  async createCustomRole(
    @GetUser() actor: RequestUser,
    @Body() dto: CreateCustomRoleDto,
  ) {
    return this.adminService.createCustomRole(
      actor,
      dto.name,
      dto.reason,
      dto.permissionIds,
    );
  }

  @Patch('roles/:roleId')
  @RequirePermissions('admin.role.change')
  async updateCustomRole(
    @GetUser() actor: RequestUser,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateCustomRoleDto,
  ) {
    return this.adminService.updateCustomRole(
      actor,
      roleId,
      dto.reason,
      dto.name,
    );
  }

  @Post('roles/:roleId/archive')
  @RequirePermissions('admin.role.change')
  async archiveCustomRole(
    @GetUser() actor: RequestUser,
    @Param('roleId') roleId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.archiveCustomRole(actor, roleId, dto.reason);
  }

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

  @Post('users/:id/roles')
  @RequirePermissions('admin.role.change')
  async assignUserRole(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Body() dto: AssignUserRoleDto,
  ) {
    return this.adminService.assignUserRole(
      actor,
      targetUserId,
      dto.roleId,
      dto.reason,
    );
  }

  @Post('users/:id/roles/:roleId/revoke')
  @RequirePermissions('admin.role.change')
  async revokeUserRole(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.revokeUserRole(
      actor,
      targetUserId,
      roleId,
      dto.reason,
    );
  }

  @Post('roles/:roleId/permissions')
  @RequirePermissions('admin.role.change')
  async grantRolePermission(
    @GetUser() actor: RequestUser,
    @Param('roleId') roleId: string,
    @Body() dto: GrantRolePermissionDto,
  ) {
    return this.adminService.grantRolePermission(
      actor,
      roleId,
      dto.permissionId,
      dto.reason,
    );
  }

  @Post('roles/:roleId/permissions/:permissionId/revoke')
  @RequirePermissions('admin.role.change')
  async revokeRolePermission(
    @GetUser() actor: RequestUser,
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.revokeRolePermission(
      actor,
      roleId,
      permissionId,
      dto.reason,
    );
  }

  @Post('users/:id/roles/privileged-requests')
  @RequirePermissions('admin.role.change')
  async requestPrivilegedRoleAssignment(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Body() dto: PrivilegedRoleRequestDto,
  ) {
    return this.adminService.requestPrivilegedRoleAssignment(
      actor,
      targetUserId,
      dto.roleId,
      dto.reason,
    );
  }

  @Post('users/:id/roles/:roleId/privileged-revoke-requests')
  @RequirePermissions('admin.role.change')
  async requestPrivilegedRoleRevocation(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.requestPrivilegedRoleRevocation(
      actor,
      targetUserId,
      roleId,
      dto.reason,
    );
  }

  @Post('role-change-requests/:requestId/approve')
  @RequirePermissions('admin.role.change', 'approval.request.process')
  async approvePrivilegedRoleChange(
    @GetUser() actor: RequestUser,
    @Param('requestId') requestId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.approvePrivilegedRoleChange(
      actor,
      requestId,
      dto.reason,
    );
  }

  @Post('role-change-requests/:requestId/reject')
  @RequirePermissions('admin.role.change', 'approval.request.process')
  async rejectPrivilegedRoleChange(
    @GetUser() actor: RequestUser,
    @Param('requestId') requestId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.rejectPrivilegedRoleChange(
      actor,
      requestId,
      dto.reason,
    );
  }
}
