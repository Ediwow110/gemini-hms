import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Test, TestingModule } from '@nestjs/testing';
import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { PrismaService } from '../prisma/prisma.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserLifecycleReasonDto } from './dto/user-lifecycle.dto';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: {
    deactivateUser: jest.Mock;
    activateUser: jest.Mock;
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
});
