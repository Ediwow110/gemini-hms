import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { BranchGuard } from '../auth/guards/branch.guard';
import {
  PERMISSIONS_KEY,
  PermissionMetadata,
} from '../auth/decorators/permissions.decorator';
import { REQUIRE_BRANCH_CONTEXT_KEY } from '../auth/decorators/branch-context.decorator';

describe('QueueController authorization contract', () => {
  const reflector = new Reflector();
  const queueService = {
    listActiveQueue: jest.fn(),
    joinQueue: jest.fn(),
    callNext: jest.fn(),
    completeEntry: jest.fn(),
    getQueueStats: jest.fn(),
  } as unknown as QueueService;
  const controller = new QueueController(queueService);

  const permissionFor = (method: keyof QueueController): PermissionMetadata => {
    const handler = QueueController.prototype[method] as unknown as (
      ...args: unknown[]
    ) => unknown;
    return reflector.get<PermissionMetadata>(PERMISSIONS_KEY, handler);
  };

  it('requires branch context at controller level', () => {
    expect(
      reflector.get<boolean>(REQUIRE_BRANCH_CONTEXT_KEY, QueueController),
    ).toBe(true);
  });

  it('requires queue.view on read routes', () => {
    expect(permissionFor('listQueue').permissions).toEqual(['queue.view']);
    expect(permissionFor('getStats').permissions).toEqual(['queue.view']);
  });

  it('requires queue.manage on mutation routes', () => {
    expect(permissionFor('joinQueue').permissions).toEqual(['queue.manage']);
    expect(permissionFor('callNext').permissions).toEqual(['queue.manage']);
    expect(permissionFor('completeEntry').permissions).toEqual([
      'queue.manage',
    ]);
  });

  it('BranchGuard rejects a non-admin targeting another branch', () => {
    const guard = new BranchGuard(reflector);
    const context = {
      getHandler: () => QueueController.prototype.listQueue,
      getClass: () => QueueController,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { branchId: 'branch-1', roles: ['Nurse'] },
          params: {},
          body: {},
          query: { branchId: 'branch-2' },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('uses the authenticated branch when the query does not provide one', async () => {
    const user = {
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      userId: 'user-1',
    };
    (queueService.listActiveQueue as jest.Mock).mockResolvedValue([]);

    await controller.listQueue(user, {});

    expect(queueService.listActiveQueue).toHaveBeenCalledWith(
      'tenant-1',
      'branch-1',
    );
  });

  it('requires an explicit branch for a global user without branch context', async () => {
    await expect(
      controller.getStats(
        { tenantId: 'tenant-1', userId: 'admin-1', roles: ['Super Admin'] },
        {},
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
