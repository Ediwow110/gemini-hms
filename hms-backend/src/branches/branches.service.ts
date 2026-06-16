import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/types/authenticated-request.type';

export interface BranchListItem {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BranchListQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async listBranches(
    actor: RequestUser,
    query: BranchListQuery,
  ): Promise<PaginatedResult<BranchListItem>> {
    const { search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId: actor.tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (!this.isSuperAdmin(actor) && actor.branchId) {
      where.id = actor.branchId;
    }

    const [data, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.branch.count({ where }),
    ]);

    return {
      data: data.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getBranch(actor: RequestUser, id: string): Promise<BranchListItem> {
    const branch = await this.prisma.branch.findFirst({
      where: { id, tenantId: actor.tenantId },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!this.isSuperAdmin(actor) && actor.branchId && actor.branchId !== id) {
      throw new NotFoundException('Branch not found');
    }

    return {
      id: branch.id,
      name: branch.name,
      code: branch.code,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    };
  }

  private isSuperAdmin(actor: RequestUser): boolean {
    return actor.roles?.includes('Super Admin') ?? false;
  }
}
