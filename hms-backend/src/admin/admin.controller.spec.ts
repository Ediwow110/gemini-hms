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
  PrivilegedRoleRequestDto,
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
    requestPrivilegedRoleAssignment: jest.Mock;
    requestPrivilegedRoleRevocation: jest.Mock;
    approvePrivilegedRoleChange: jest.Mock;
    rejectPrivilegedRoleChange: jest.Mock;
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
      requestPrivilegedRoleAssignment: jest.fn(),
      requestPrivilegedRoleRevocation: jest.fn(),
      approvePrivilegedRoleChange: jest.fn(),
      rejectPrivilegedRoleChange: jest.fn(),
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

  it('privileged assignment request endpoint requires admin.role.change metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'requestPrivilegedRoleAssignment',
    );
    const permissions = Reflect.getMetadata(
      PERMISSIONS_KEY,
      descriptor?.value as object,
    );

    expect(permissions).toEqual(['admin.role.change']);
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

    expect(permissions).toEqual(['admin.role.change']);
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

    expect(permissions).toEqual([
      'admin.role.change',
      'approval.request.process',
    ]);
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

    expect(permissions).toEqual([
      'admin.role.change',
      'approval.request.process',
    ]);
  });

  it('create role endpoint requires admin.role.change metadata', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AdminController.prototype,
      'createCustomRole',
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
});
