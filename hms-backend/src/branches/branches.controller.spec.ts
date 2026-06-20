import { Test, TestingModule } from '@nestjs/testing';
import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';

describe('BranchesController', () => {
  let controller: BranchesController;
  let branchesService: any;

  const actor: RequestUser = {
    userId: 'actor-id',
    tenantId: 'tenant-id',
    roles: ['Super Admin'],
    tokenVersion: 0,
  };

  beforeEach(async () => {
    branchesService = {
      listBranches: jest.fn(),
      getBranch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchesController],
      providers: [
        { provide: BranchesService, useValue: branchesService },
        {
          provide: PrismaService,
          useValue: { userRole: { findMany: jest.fn() } },
        },
      ],
    }).compile();

    controller = module.get<BranchesController>(BranchesController);
  });

  describe('listBranches', () => {
    it('listBranches endpoint requires admin.health.view metadata', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        BranchesController.prototype,
        'listBranches',
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

    it('calls service.listBranches with parsed params', async () => {
      const result = { data: [], total: 0, page: 1, limit: 20 };
      branchesService.listBranches.mockResolvedValue(result);

      const response = await controller.listBranches(actor, 'test', '2', '10');

      expect(branchesService.listBranches).toHaveBeenCalledWith(actor, {
        search: 'test',
        page: 2,
        limit: 10,
      });
      expect(response).toEqual(result);
    });

    it('calls service.listBranches with default pagination when params omitted', async () => {
      const result = { data: [], total: 0, page: 1, limit: 20 };
      branchesService.listBranches.mockResolvedValue(result);

      await controller.listBranches(actor, undefined, undefined, undefined);

      expect(branchesService.listBranches).toHaveBeenCalledWith(actor, {
        search: undefined,
        page: undefined,
        limit: undefined,
      });
    });
  });

  describe('getBranch', () => {
    it('getBranch endpoint requires admin.health.view metadata', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        BranchesController.prototype,
        'getBranch',
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

    it('calls service.getBranch with id', async () => {
      const result = {
        id: 'branch-id',
        name: 'Main Branch',
        code: 'MAIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      branchesService.getBranch.mockResolvedValue(result);

      const response = await controller.getBranch(actor, 'branch-id');

      expect(branchesService.getBranch).toHaveBeenCalledWith(
        actor,
        'branch-id',
      );
      expect(response).toEqual(result);
    });
  });
});
