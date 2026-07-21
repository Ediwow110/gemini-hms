import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { MetricsService } from './metrics.service';
import {
  AssignUserRoleDto,
  CreateCustomRoleDto,
  CreateUserDto,
  GrantRolePermissionDto,
  PrivilegedRoleRequestDto,
  PrivilegedUserProfileUpdateDto,
  UpdateCustomRoleDto,
  UpdateUserDto,
  UserLifecycleReasonDto,
} from './dto/user-lifecycle.dto';

@UseGuards(PermissionsGuard)
@Controller('api/v1/admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get('tenants')
  @RequirePermissions('admin.health.view')
  async listTenants(@GetUser() actor: RequestUser) {
    return this.adminService.listTenants(actor);
  }

  @Get('health')
  @RequirePermissions('admin.health.view')
  async getHealth() {
    return this.adminService.getHealth();
  }

  @Get('users')
  @RequirePermissions('admin.health.view')
  async listUsers(
    @GetUser() actor: RequestUser,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listUsers(actor, {
      search,
      status,
      branchId,
      page: page ? Math.max(1, parseInt(page, 10) || 1) : undefined,
      limit: limit ? Math.max(1, parseInt(limit, 10) || 1) : undefined,
    });
  }

  @Get('users/:id')
  @RequirePermissions('admin.health.view')
  async getUser(@GetUser() actor: RequestUser, @Param('id') id: string) {
    return this.adminService.getUser(actor, id);
  }

  @Get('roles')
  @RequirePermissions('admin.health.view')
  async listRoles(@GetUser() actor: RequestUser) {
    return this.adminService.listRoles(actor);
  }

  @Get('permissions')
  @RequirePermissions('admin.health.view')
  async listPermissions(@GetUser() actor: RequestUser) {
    return this.adminService.listPermissions(actor);
  }

  @Get('metrics')
  @RequirePermissions('admin.metrics.view')
  getMetrics() {
    return this.metricsService.getMetrics();
  }

  @Get('metrics/prometheus')
  @RequirePermissions('admin.metrics.view')
  getPrometheusMetrics() {
    return this.metricsService.getPrometheusFormat();
  }

  @Post('users')
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
  @RequirePermissions('admin.role.change')
  async createUser(@GetUser() actor: RequestUser, @Body() dto: CreateUserDto) {
    return this.adminService.createUser(actor, dto);
  }

  @Patch('users/:id')
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
  @RequirePermissions('admin.role.change')
  async updateUser(
    @GetUser() actor: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(actor, id, dto);
  }

  @Post('roles')
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
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
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
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
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
  @RequirePermissions('admin.role.change')
  async archiveCustomRole(
    @GetUser() actor: RequestUser,
    @Param('roleId') roleId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.archiveCustomRole(actor, roleId, dto.reason);
  }

  @Post('users/:id/deactivate')
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
  @RequirePermissions('admin.role.change')
  async deactivateUser(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.deactivateUser(actor, targetUserId, dto.reason);
  }

  @Post('users/:id/activate')
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
  @RequirePermissions('admin.role.change')
  async activateUser(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.activateUser(actor, targetUserId, dto.reason);
  }

  @Post('users/:id/force-logout')
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
  @RequirePermissions('admin.role.change')
  async forceLogout(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.forceLogout(actor, targetUserId, dto.reason);
  }

  @Post('users/:id/reset-password')
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
  @RequirePermissions('admin.role.change')
  async resetPassword(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.resetPassword(actor, targetUserId, dto.reason);
  }

  @Post('users/:id/reset-mfa')
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
  @RequirePermissions('admin.role.change')
  async resetUserMfa(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.resetUserMfa(actor, targetUserId, dto.reason);
  }

  @Post('users/:id/roles')
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
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
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
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
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
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
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
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
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
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
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
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

  @Post('roles/:roleId/permissions/:permissionId/privileged-requests')
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
  @RequirePermissions('admin.role.change')
  async requestPrivilegedRolePermissionGrant(
    @GetUser() actor: RequestUser,
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.requestPrivilegedRolePermissionGrant(
      actor,
      roleId,
      permissionId,
      dto.reason,
    );
  }

  @Post('roles/:roleId/permissions/:permissionId/privileged-revoke-requests')
  @Throttle({ sensitive: { limit: 10, ttl: 60000 } })
  @RequirePermissions('admin.role.change')
  async requestPrivilegedRolePermissionRevoke(
    @GetUser() actor: RequestUser,
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.requestPrivilegedRolePermissionRevoke(
      actor,
      roleId,
      permissionId,
      dto.reason,
    );
  }

  @Post('role-permission-change-requests/:requestId/approve')
  @RequirePermissions('admin.role.change', 'approval.request.process')
  async approvePrivilegedRolePermissionChange(
    @GetUser() actor: RequestUser,
    @Param('requestId') requestId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.approvePrivilegedRolePermissionChange(
      actor,
      requestId,
      dto.reason,
    );
  }

  @Post('role-permission-change-requests/:requestId/reject')
  @RequirePermissions('admin.role.change', 'approval.request.process')
  async rejectPrivilegedRolePermissionChange(
    @GetUser() actor: RequestUser,
    @Param('requestId') requestId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.rejectPrivilegedRolePermissionChange(
      actor,
      requestId,
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

  @Post('users/:id/privileged-lifecycle-requests/deactivate')
  @RequirePermissions('admin.role.change')
  async requestPrivilegedUserDeactivation(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.requestPrivilegedUserDeactivation(
      actor,
      targetUserId,
      dto.reason,
    );
  }

  @Post('users/:id/privileged-lifecycle-requests/activate')
  @RequirePermissions('admin.role.change')
  async requestPrivilegedUserActivation(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.requestPrivilegedUserActivation(
      actor,
      targetUserId,
      dto.reason,
    );
  }

  @Post('users/:id/privileged-profile-requests')
  @RequirePermissions('admin.role.change')
  async requestPrivilegedUserProfileUpdate(
    @GetUser() actor: RequestUser,
    @Param('id') targetUserId: string,
    @Body() dto: PrivilegedUserProfileUpdateDto,
  ) {
    return this.adminService.requestPrivilegedUserProfileUpdate(
      actor,
      targetUserId,
      dto,
    );
  }

  @Post('privileged-user-change-requests/:requestId/approve')
  @RequirePermissions('admin.role.change', 'approval.request.process')
  async approvePrivilegedUserChange(
    @GetUser() actor: RequestUser,
    @Param('requestId') requestId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.approvePrivilegedUserChange(
      actor,
      requestId,
      dto.reason,
    );
  }

  @Post('privileged-user-change-requests/:requestId/reject')
  @RequirePermissions('admin.role.change', 'approval.request.process')
  async rejectPrivilegedUserChange(
    @GetUser() actor: RequestUser,
    @Param('requestId') requestId: string,
    @Body() dto: UserLifecycleReasonDto,
  ) {
    return this.adminService.rejectPrivilegedUserChange(
      actor,
      requestId,
      dto.reason,
    );
  }
}
