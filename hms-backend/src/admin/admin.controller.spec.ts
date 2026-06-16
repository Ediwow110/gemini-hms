import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Test, TestingModule } from '@nestjs/testing';
import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { PrismaService } from '../prisma/prisma.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MetricsService } from './metrics.service';
import {
  AssignUserRoleDto,
  CreateUserDto,
  GrantRolePermissionDto,
  PrivilegedRoleRequestDto,
  PrivilegedUserProfileUpdateDto,
  UpdateCustomRoleDto,
  UpdateUserDto,
  UserLifecycleReasonDto,
} from './dto/user-lifecycle.dto';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: any;

  const actor: RequestUser = {
    userId: 'actor-id',
    tenantId: 'tenant-id',
    roles: ['Super Admin'],
    tokenVersion: 0,
  };

  beforeEach(async () => {
    adminService = {
      listUsers: jest.fn(),
      getUser: jest.fn(),
      listRoles: jest.fn(),
      listPermissions: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      createCustomRole: jest.fn(),
      updateCustomRole: jest.fn(),
      archiveCustomRole: jest.fn(),
      deactivateUser: jest.fn(),
      activateUser: jest.fn(),
      assignUserRole: jest.fn(),
      revokeUserRole: jest.fn(),
      grantRolePermission: jest.fn(),
      revokeRolePermission: jest.fn(),
      requestPrivilegedRoleAssignment: jest.fn(),
      requestPrivilegedRoleRevocation: jest.fn(),
      approvePrivilegedRoleChange: jest.fn(),
      rejectPrivilegedRoleChange: jest.fn(),
      requestPrivilegedRolePermissionGrant: jest.fn(),
      requestPrivilegedRolePermissionRevoke: jest.fn(),
      approvePrivilegedRolePermissionChange: jest.fn(),
      rejectPrivilegedRolePermissionChange: jest.fn(),
      requestPrivilegedUserDeactivation: jest.fn(),
      requestPrivilegedUserActivation: jest.fn(),
      requestPrivilegedUserProfileUpdate: jest.fn(),
      approvePrivilegedUserChange: jest.fn(),
      rejectPrivilegedUserChange: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: adminService },
        {
          provide: PrismaService,
          useValue: { userRole: { findMany: jest.fn() } },
        },
        {
          provide: MetricsService,
          useValue: {
            getMetrics: jest.fn().mockReturnValue({}),
            getPrometheusFormat: jest.fn().mockReturnValue(''),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('deactivate endpoint requires admin.role.change metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'deactivateUser',
    );
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      descriptor?.value as object,
    );

    expect(permissions).toEqual({
      mode: 'any',
      permissions: ['admin.role.change'],
    });
  });

  it('activate endpoint requires admin.role.change metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'activateUser',
    );
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      descriptor?.value as object,
    );

    expect(permissions).toEqual({
      mode: 'any',
      permissions: ['admin.role.change'],
    });
  });

  it('assign role endpoint requires admin.role.change metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'assignUserRole',
    );
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      descriptor?.value as object,
    );

    expect(permissions).toEqual({
      mode: 'any',
      permissions: ['admin.role.change'],
    });
  });

  it('revoke role endpoint requires admin.role.change metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'revokeUserRole',
    );
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      descriptor?.value as object,
    );

    expect(permissions).toEqual({
      mode: 'any',
      permissions: ['admin.role.change'],
    });
  });

  it('grant permission endpoint requires admin.role.change metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'grantRolePermission',
    );
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      descriptor?.value as object,
    );

    expect(permissions).toEqual({
      mode: 'any',
      permissions: ['admin.role.change'],
    });
  });

  it('revoke permission endpoint requires admin.role.change metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'revokeRolePermission',
    );
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      descriptor?.value as object,
    );

    expect(permissions).toEqual({
      mode: 'any',
      permissions: ['admin.role.change'],
    });
  });

  it('create user endpoint requires admin.role.change metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'createUser',
    );
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      descriptor?.value as object,
    );

    expect(permissions).toEqual({
      mode: 'any',
      permissions: ['admin.role.change'],
    });
  });

  it('createUser calls adminService.createUser', async () => {
    const dto: CreateUserDto = {
      email: 'new@hospital.com',
      password: 'Password123',
      branchIds: ['branch-id'],
      reason: 'valid reason',
    };
    adminService.createUser.mockResolvedValue({
      userId: 'new-id',
      email: dto.email,
    });

    await controller.createUser(actor, dto);

    expect(adminService.createUser).toHaveBeenCalledWith(actor, dto);
  });

  it('update user endpoint requires admin.role.change metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'updateUser',
    );
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      descriptor?.value as object,
    );

    expect(permissions).toEqual({
      mode: 'any',
      permissions: ['admin.role.change'],
    });
  });

  it('updateUser calls adminService.updateUser', async () => {
    const dto: UpdateUserDto = {
      email: 'updated@hospital.com',
      reason: 'valid reason',
    };
    adminService.updateUser.mockResolvedValue({
      userId: 'user-id',
      email: dto.email,
      isMfaEnabled: false,
    });

    await controller.updateUser(actor, 'user-id', dto);

    expect(adminService.updateUser).toHaveBeenCalledWith(actor, 'user-id', dto);
  });

  it('privileged assignment request endpoint requires admin.role.change metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'requestPrivilegedRoleAssignment',
    );
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      descriptor?.value as object,
    );

    expect(permissions).toEqual({
      mode: 'any',
      permissions: ['admin.role.change'],
    });
  });

  it('privileged revoke request endpoint requires admin.role.change metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'requestPrivilegedRoleRevocation',
    );
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      descriptor?.value as object,
    );

    expect(permissions).toEqual({
      mode: 'any',
      permissions: ['admin.role.change'],
    });
  });

  it('approve privileged role request endpoint includes admin.role.change and approval.request.process metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'approvePrivilegedRoleChange',
    );
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      descriptor?.value as object,
    );

    expect(permissions).toEqual({
      mode: 'any',
      permissions: ['admin.role.change', 'approval.request.process'],
    });
  });

  it('reject privileged role request endpoint includes admin.role.change and approval.request.process metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'rejectPrivilegedRoleChange',
    );
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      descriptor?.value as object,
    );

    expect(permissions).toEqual({
      mode: 'any',
      permissions: ['admin.role.change', 'approval.request.process'],
    });
  });

  it('archive role endpoint requires admin.role.change metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'archiveCustomRole',
    );
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      descriptor?.value as object,
    );

    expect(permissions).toEqual({
      mode: 'any',
      permissions: ['admin.role.change'],
    });
  });

  it('update role endpoint requires admin.role.change metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'updateCustomRole',
    );
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      descriptor?.value as object,
    );

    expect(permissions).toEqual({
      mode: 'any',
      permissions: ['admin.role.change'],
    });
  });

  it('deactivateUser calls adminService.deactivateUser', async () => {
    adminService.deactivateUser.mockResolvedValue({ id: 'target-id' });

    await controller.deactivateUser(actor, 'target-id', { reason: 'valid' });

    expect(adminService.deactivateUser).toHaveBeenCalledWith(
      actor,
      'target-id',
      'valid',
    );
  });

  it('activate forwards actor, target, and reason to service', async () => {
    adminService.activateUser.mockResolvedValue({ id: 'target-id' });

    await controller.activateUser(actor, 'target-id', { reason: 'valid' });

    expect(adminService.activateUser).toHaveBeenCalledWith(
      actor,
      'target-id',
      'valid',
    );
  });

  it('assign role forwards actor, target, role, and reason to service', async () => {
    adminService.assignUserRole.mockResolvedValue({ userId: 'target-id' });

    await controller.assignUserRole(actor, 'target-id', {
      roleId: 'role-id',
      reason: 'valid',
    });

    expect(adminService.assignUserRole).toHaveBeenCalledWith(
      actor,
      'target-id',
      'role-id',
      'valid',
    );
  });

  it('revoke role forwards actor, target, role, and reason to service', async () => {
    adminService.revokeUserRole.mockResolvedValue({ userId: 'target-id' });

    await controller.revokeUserRole(actor, 'target-id', 'role-id', {
      reason: 'valid',
    });

    expect(adminService.revokeUserRole).toHaveBeenCalledWith(
      actor,
      'target-id',
      'role-id',
      'valid',
    );
  });

  it('grant permission forwards actor, role, permission, and reason to service', async () => {
    adminService.grantRolePermission.mockResolvedValue({ roleId: 'role-id' });

    await controller.grantRolePermission(actor, 'role-id', {
      permissionId: 'permission-id',
      reason: 'valid',
    });

    expect(adminService.grantRolePermission).toHaveBeenCalledWith(
      actor,
      'role-id',
      'permission-id',
      'valid',
    );
  });

  it('revoke permission forwards actor, role, permission, and reason to service', async () => {
    adminService.revokeRolePermission.mockResolvedValue({ roleId: 'role-id' });

    await controller.revokeRolePermission(actor, 'role-id', 'permission-id', {
      reason: 'valid',
    });

    expect(adminService.revokeRolePermission).toHaveBeenCalledWith(
      actor,
      'role-id',
      'permission-id',
      'valid',
    );
  });

  it('privileged assignment request forwards actor, target, role, and reason to service', async () => {
    adminService.requestPrivilegedRoleAssignment.mockResolvedValue({
      requestId: 'request-id',
    });

    await controller.requestPrivilegedRoleAssignment(actor, 'target-id', {
      roleId: 'role-id',
      reason: 'valid',
    });

    expect(adminService.requestPrivilegedRoleAssignment).toHaveBeenCalledWith(
      actor,
      'target-id',
      'role-id',
      'valid',
    );
  });

  it('privileged revoke request forwards actor, target, role, and reason to service', async () => {
    adminService.requestPrivilegedRoleRevocation.mockResolvedValue({
      requestId: 'request-id',
    });

    await controller.requestPrivilegedRoleRevocation(
      actor,
      'target-id',
      'role-id',
      { reason: 'valid' },
    );

    expect(adminService.requestPrivilegedRoleRevocation).toHaveBeenCalledWith(
      actor,
      'target-id',
      'role-id',
      'valid',
    );
  });

  it('approve privileged role request forwards actor, request, and reason to service', async () => {
    adminService.approvePrivilegedRoleChange.mockResolvedValue({
      requestId: 'request-id',
    });

    await controller.approvePrivilegedRoleChange(actor, 'request-id', {
      reason: 'valid',
    });

    expect(adminService.approvePrivilegedRoleChange).toHaveBeenCalledWith(
      actor,
      'request-id',
      'valid',
    );
  });

  it('reject privileged role request forwards actor, request, and reason to service', async () => {
    adminService.rejectPrivilegedRoleChange.mockResolvedValue({
      requestId: 'request-id',
    });

    await controller.rejectPrivilegedRoleChange(actor, 'request-id', {
      reason: 'valid',
    });

    expect(adminService.rejectPrivilegedRoleChange).toHaveBeenCalledWith(
      actor,
      'request-id',
      'valid',
    );
  });

  it('deactivate DTO rejects blank reason', async () => {
    const dto = plainToInstance(UserLifecycleReasonDto, { reason: '   ' });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('activate DTO rejects missing reason', async () => {
    const dto = plainToInstance(UserLifecycleReasonDto, {});

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('assign DTO rejects blank roleId', async () => {
    const assignDto = plainToInstance(AssignUserRoleDto, {
      roleId: '   ',
      reason: 'ok',
    });

    const errors = await validate(assignDto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('grant permission DTO rejects blank permissionId', async () => {
    const grantDto = plainToInstance(GrantRolePermissionDto, {
      permissionId: '   ',
      reason: 'ok',
    });

    const errors = await validate(grantDto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('grant permission DTO rejects blank reason', async () => {
    const grantDto = plainToInstance(GrantRolePermissionDto, {
      permissionId: 'permission-id',
      reason: '   ',
    });

    const errors = await validate(grantDto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('privileged role request DTO rejects blank roleId', async () => {
    const dto = plainToInstance(PrivilegedRoleRequestDto, {
      roleId: '   ',
      reason: 'valid',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('updateCustomRole calls adminService.updateCustomRole', async () => {
    adminService.updateCustomRole.mockResolvedValue({
      roleId: 'role-id',
      name: 'New Name',
      status: 'ACTIVE',
      isSystem: false,
    });

    await controller.updateCustomRole(actor, 'role-id', {
      name: 'New Name',
      reason: 'valid',
    });

    expect(adminService.updateCustomRole).toHaveBeenCalledWith(
      actor,
      'role-id',
      'valid',
      'New Name',
    );
  });

  it('UpdateCustomRoleDto rejects blank reason', async () => {
    const dto = plainToInstance(UpdateCustomRoleDto, {
      name: 'New Name',
      reason: '   ',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('UpdateCustomRoleDto rejects blank name if provided', async () => {
    const dto = plainToInstance(UpdateCustomRoleDto, {
      name: '   ',
      reason: 'valid reason',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('UpdateCustomRoleDto accepts valid metadata', async () => {
    const dto = plainToInstance(UpdateCustomRoleDto, {
      name: 'New Name',
      reason: 'valid reason',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('UpdateUserDto rejects invalid data', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      email: 'not-an-email',
      reason: 'short',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('UpdateUserDto accepts valid data', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      email: 'updated@hospital.com',
      isMfaEnabled: true,
      reason: 'valid reason',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('CreateUserDto rejects invalid data', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'not-an-email',
      password: '',
      branchIds: [],
      reason: 'short',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('CreateUserDto accepts valid data', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'valid@hospital.com',
      password: 'Password123',
      branchIds: ['branch-id'],
      reason: 'valid reason',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  describe('Privileged User Mutation Endpoints', () => {
    it('requestPrivilegedUserDeactivation calls service', async () => {
      adminService.requestPrivilegedUserDeactivation.mockResolvedValue({
        requestId: 'req-id',
      });
      await controller.requestPrivilegedUserDeactivation(actor, 'user-id', {
        reason: 'valid',
      });
      expect(
        adminService.requestPrivilegedUserDeactivation,
      ).toHaveBeenCalledWith(actor, 'user-id', 'valid');
    });

    it('requestPrivilegedUserActivation calls service', async () => {
      adminService.requestPrivilegedUserActivation.mockResolvedValue({
        requestId: 'req-id',
      });
      await controller.requestPrivilegedUserActivation(actor, 'user-id', {
        reason: 'valid',
      });
      expect(adminService.requestPrivilegedUserActivation).toHaveBeenCalledWith(
        actor,
        'user-id',
        'valid',
      );
    });

    it('requestPrivilegedUserProfileUpdate calls service', async () => {
      const dto: PrivilegedUserProfileUpdateDto = {
        email: 'new@email.com',
        reason: 'valid',
      };
      adminService.requestPrivilegedUserProfileUpdate.mockResolvedValue({
        requestId: 'req-id',
      });
      await controller.requestPrivilegedUserProfileUpdate(
        actor,
        'user-id',
        dto,
      );
      expect(
        adminService.requestPrivilegedUserProfileUpdate,
      ).toHaveBeenCalledWith(actor, 'user-id', dto);
    });

    it('approvePrivilegedUserChange calls service', async () => {
      adminService.approvePrivilegedUserChange.mockResolvedValue({
        requestId: 'req-id',
      });
      await controller.approvePrivilegedUserChange(actor, 'req-id', {
        reason: 'valid',
      });
      expect(adminService.approvePrivilegedUserChange).toHaveBeenCalledWith(
        actor,
        'req-id',
        'valid',
      );
    });

    it('rejectPrivilegedUserChange calls service', async () => {
      adminService.rejectPrivilegedUserChange.mockResolvedValue({
        requestId: 'req-id',
      });
      await controller.rejectPrivilegedUserChange(actor, 'req-id', {
        reason: 'valid',
      });
      expect(adminService.rejectPrivilegedUserChange).toHaveBeenCalledWith(
        actor,
        'req-id',
        'valid',
      );
    });
  });

  describe('User Query Endpoints', () => {
    it('listUsers endpoint requires admin.health.view metadata', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        AdminController.prototype,
        'listUsers',
      );
      const permissions = Reflect.getMetadata(
        PERMISSIONS_KEY,
        descriptor?.value as object,
      );

      expect(permissions).toEqual({
        mode: 'any',
        permissions: ['admin.health.view'],
      });
    });

    it('listUsers calls adminService.listUsers', async () => {
      adminService.listUsers.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 50,
      });

      await controller.listUsers(actor, undefined, undefined, undefined, undefined, undefined);

      expect(adminService.listUsers).toHaveBeenCalledWith(actor, {
        search: undefined,
        status: undefined,
        branchId: undefined,
        page: undefined,
        limit: undefined,
      });
    });

    it('listUsers parses pagination params', async () => {
      adminService.listUsers.mockResolvedValue({
        data: [],
        total: 0,
        page: 2,
        limit: 10,
      });

      await controller.listUsers(actor, '', 'ACTIVE', 'branch-id', '2', '10');

      expect(adminService.listUsers).toHaveBeenCalledWith(actor, {
        search: '',
        status: 'ACTIVE',
        branchId: 'branch-id',
        page: 2,
        limit: 10,
      });
    });

    it('getUser endpoint requires admin.health.view metadata', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        AdminController.prototype,
        'getUser',
      );
      const permissions = Reflect.getMetadata(
        PERMISSIONS_KEY,
        descriptor?.value as object,
      );

      expect(permissions).toEqual({
        mode: 'any',
        permissions: ['admin.health.view'],
      });
    });

    it('getUser calls adminService.getUser', async () => {
      adminService.getUser.mockResolvedValue({ id: 'user-id', email: 'user@test.com' });

      await controller.getUser(actor, 'user-id');

      expect(adminService.getUser).toHaveBeenCalledWith(actor, 'user-id');
    });
  });

  describe('Role / Permission Query Endpoints', () => {
    it('listRoles endpoint requires admin.health.view metadata', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        AdminController.prototype,
        'listRoles',
      );
      const permissions = Reflect.getMetadata(
        PERMISSIONS_KEY,
        descriptor?.value as object,
      );

      expect(permissions).toEqual({
        mode: 'any',
        permissions: ['admin.health.view'],
      });
    });

    it('listRoles calls adminService.listRoles', async () => {
      adminService.listRoles.mockResolvedValue([]);

      await controller.listRoles(actor);

      expect(adminService.listRoles).toHaveBeenCalledWith(actor);
    });

    it('listPermissions endpoint requires admin.health.view metadata', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        AdminController.prototype,
        'listPermissions',
      );
      const permissions = Reflect.getMetadata(
        PERMISSIONS_KEY,
        descriptor?.value as object,
      );

      expect(permissions).toEqual({
        mode: 'any',
        permissions: ['admin.health.view'],
      });
    });

    it('listPermissions calls adminService.listPermissions', async () => {
      adminService.listPermissions.mockResolvedValue([]);

      await controller.listPermissions(actor);

      expect(adminService.listPermissions).toHaveBeenCalledWith(actor);
    });
  });

  describe('Privileged Role Permission Mutation Endpoints', () => {
    it('request privileged role permission grant endpoint requires admin.role.change metadata', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        AdminController.prototype,
        'requestPrivilegedRolePermissionGrant',
      );
      const permissions = Reflect.getMetadata(
        PERMISSIONS_KEY,
        descriptor?.value as object,
      );
      expect(permissions).toEqual({
        mode: 'any',
        permissions: ['admin.role.change'],
      });
    });

    it('request privileged role permission revoke endpoint requires admin.role.change metadata', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        AdminController.prototype,
        'requestPrivilegedRolePermissionRevoke',
      );
      const permissions = Reflect.getMetadata(
        PERMISSIONS_KEY,
        descriptor?.value as object,
      );
      expect(permissions).toEqual({
        mode: 'any',
        permissions: ['admin.role.change'],
      });
    });

    it('approve privileged role permission change endpoint includes admin.role.change and approval.request.process metadata', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        AdminController.prototype,
        'approvePrivilegedRolePermissionChange',
      );
      const permissions = Reflect.getMetadata(
        PERMISSIONS_KEY,
        descriptor?.value as object,
      );
      expect(permissions).toEqual({
        mode: 'any',
        permissions: ['admin.role.change', 'approval.request.process'],
      });
    });

    it('reject privileged role permission change endpoint includes admin.role.change and approval.request.process metadata', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        AdminController.prototype,
        'rejectPrivilegedRolePermissionChange',
      );
      const permissions = Reflect.getMetadata(
        PERMISSIONS_KEY,
        descriptor?.value as object,
      );
      expect(permissions).toEqual({
        mode: 'any',
        permissions: ['admin.role.change', 'approval.request.process'],
      });
    });

    it('requestPrivilegedRolePermissionGrant calls service', async () => {
      adminService.requestPrivilegedRolePermissionGrant.mockResolvedValue({
        requestId: 'req-id',
      });
      await controller.requestPrivilegedRolePermissionGrant(
        actor,
        'role-id',
        'perm-id',
        {
          reason: 'valid',
        },
      );
      expect(
        adminService.requestPrivilegedRolePermissionGrant,
      ).toHaveBeenCalledWith(actor, 'role-id', 'perm-id', 'valid');
    });

    it('requestPrivilegedRolePermissionRevoke calls service', async () => {
      adminService.requestPrivilegedRolePermissionRevoke.mockResolvedValue({
        requestId: 'req-id',
      });
      await controller.requestPrivilegedRolePermissionRevoke(
        actor,
        'role-id',
        'perm-id',
        {
          reason: 'valid',
        },
      );
      expect(
        adminService.requestPrivilegedRolePermissionRevoke,
      ).toHaveBeenCalledWith(actor, 'role-id', 'perm-id', 'valid');
    });

    it('approvePrivilegedRolePermissionChange calls service', async () => {
      adminService.approvePrivilegedRolePermissionChange.mockResolvedValue({
        requestId: 'req-id',
      });
      await controller.approvePrivilegedRolePermissionChange(actor, 'req-id', {
        reason: 'valid',
      });
      expect(
        adminService.approvePrivilegedRolePermissionChange,
      ).toHaveBeenCalledWith(actor, 'req-id', 'valid');
    });

    it('rejectPrivilegedRolePermissionChange calls service', async () => {
      adminService.rejectPrivilegedRolePermissionChange.mockResolvedValue({
        requestId: 'req-id',
      });
      await controller.rejectPrivilegedRolePermissionChange(actor, 'req-id', {
        reason: 'valid',
      });
      expect(
        adminService.rejectPrivilegedRolePermissionChange,
      ).toHaveBeenCalledWith(actor, 'req-id', 'valid');
    });
  });
});
