import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { BranchesService } from './branches.service';

describe('BranchesService', () => {
  let service: BranchesService;
  let prisma: any;

  const superAdminActor: RequestUser = {
    userId: 'actor-id',
    tenantId: 'tenant-id',
    roles: ['Super Admin'],
    tokenVersion: 0,
  };

  const branchActor: RequestUser = {
    userId: 'branch-actor-id',
    tenantId: 'tenant-id',
    branchId: 'branch-id',
    roles: ['Branch Admin'],
    tokenVersion: 0,
  };

  const otherBranchActor: RequestUser = {
    userId: 'other-actor-id',
    tenantId: 'tenant-id',
    branchId: 'other-branch-id',
    roles: ['Branch Admin'],
    tokenVersion: 0,
  };

  const mockBranches = [
    {
      id: 'branch-1',
      tenantId: 'tenant-id',
      name: 'Main Branch',
      code: 'MAIN',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: 'branch-2',
      tenantId: 'tenant-id',
      name: 'East Wing',
      code: 'EAST',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-02'),
    },
    {
      id: 'branch-3',
      tenantId: 'other-tenant',
      name: 'Other Branch',
      code: 'OTHER',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-02'),
    },
  ];

  beforeEach(async () => {
    prisma = {
      branch: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
  });

  describe('listBranches', () => {
    it('returns empty list when no branches exist', async () => {
      prisma.branch.findMany.mockResolvedValue([]);
      prisma.branch.count.mockResolvedValue(0);

      const result = await service.listBranches(superAdminActor, {});

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });
      expect(prisma.branch.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-id' },
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' },
      });
    });

    it('returns all tenant branches for super admin', async () => {
      const tenantBranches = mockBranches.filter(
        (b) => b.tenantId === 'tenant-id',
      );
      prisma.branch.findMany.mockResolvedValue(tenantBranches);
      prisma.branch.count.mockResolvedValue(tenantBranches.length);

      const result = await service.listBranches(superAdminActor, {});

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data.map((b) => b.id)).toEqual(['branch-1', 'branch-2']);
    });

    it('filters by search query', async () => {
      prisma.branch.findMany.mockResolvedValue([mockBranches[0]]);
      prisma.branch.count.mockResolvedValue(1);

      const result = await service.listBranches(superAdminActor, {
        search: 'Main',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Main Branch');
      expect(prisma.branch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'Main', mode: 'insensitive' } },
              { code: { contains: 'Main', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('respects pagination params', async () => {
      prisma.branch.findMany.mockResolvedValue([mockBranches[0]]);
      prisma.branch.count.mockResolvedValue(2);

      const result = await service.listBranches(superAdminActor, {
        page: 2,
        limit: 1,
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(1);
      expect(prisma.branch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 1,
          take: 1,
        }),
      );
    });

    it('restricts to own branch for branch-scoped actor', async () => {
      prisma.branch.findMany.mockResolvedValue([mockBranches[0]]);
      prisma.branch.count.mockResolvedValue(1);

      const result = await service.listBranches(branchActor, {});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('branch-1');
      expect(prisma.branch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'branch-id' }),
        }),
      );
    });
  });

  describe('getBranch', () => {
    it('returns branch by id for super admin', async () => {
      prisma.branch.findFirst.mockResolvedValue(mockBranches[0]);

      const result = await service.getBranch(superAdminActor, 'branch-1');

      expect(result.id).toBe('branch-1');
      expect(result.name).toBe('Main Branch');
      expect(result.code).toBe('MAIN');
      expect(prisma.branch.findFirst).toHaveBeenCalledWith({
        where: { id: 'branch-1', tenantId: 'tenant-id' },
      });
    });

    it('throws NotFoundException when branch does not exist', async () => {
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(
        service.getBranch(superAdminActor, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when branch belongs to different tenant', async () => {
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(
        service.getBranch(superAdminActor, 'branch-3'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns branch when branch-scoped actor requests own branch', async () => {
      const ownBranch = { ...mockBranches[0], id: 'branch-id' };
      prisma.branch.findFirst.mockResolvedValue(ownBranch);

      const result = await service.getBranch(branchActor, 'branch-id');

      expect(result.id).toBe('branch-id');
    });

    it('throws NotFoundException when branch-scoped actor requests different branch', async () => {
      const ownBranch = { ...mockBranches[0], id: 'branch-id' };
      prisma.branch.findFirst.mockResolvedValue(ownBranch);

      await expect(
        service.getBranch(otherBranchActor, 'branch-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
