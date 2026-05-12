import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Test, TestingModule } from '@nestjs/testing';
import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { PrismaService } from '../prisma/prisma.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import {
  AssignUserRoleDto,
  GrantRolePermissionDto,
  UserLifecycleReasonDto,
} from './dto/user-lifecycle.dto';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: {
    deactivateUser: jest.Mock;
    activateUser: jest.Mock;
    assignUserRole: jest.Mock;
    revokeUserRole: jest.Mock;
    grantRolePermission: jest.Mock;
    revokeRolePermission: jest.Mock;
  };

  const actor: RequestUser = {
    userId: 'actor-id',
    tenantId: 'tenant-id',
    roles: ['Super Admin'],
    tokenVersion: 0,
  };

  beforeEach(async () => {
    adminService = {
      deactivateUser: jest.fn(),
      activateUser: jest.fn(),
      assignUserRole: jest.fn(),
      revokeUserRole: jest.fn(),
      grantRolePermission: jest.fn(),
      revokeRolePermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: adminService },
        {
          provide: PrismaService,
          useValue: { userRole: { findMany: jest.fn() } },
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

    expect(permissions).toEqual(['admin.role.change']);
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

    expect(permissions).toEqual(['admin.role.change']);
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

    expect(permissions).toEqual(['admin.role.change']);
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

    expect(permissions).toEqual(['admin.role.change']);
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

    expect(permissions).toEqual(['admin.role.change']);
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

    expect(permissions).toEqual(['admin.role.change']);
  });

  it('deactivate forwards actor, target, and reason to service', async () => {
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
});
