import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateItemDto,
  UpdateItemDto,
  SetPriceDto,
  GetItemsQueryDto,
  GetCategoriesQueryDto,
} from './dto/catalog.dto';

@Injectable()
export class CatalogService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createCategory(
    tenantId: string,
    userId: string,
    dto: CreateCategoryDto,
  ) {
    const category = await this.prisma.serviceCategory.create({
      data: {
        tenantId,
        ...dto,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'CATALOG_CATEGORY_CREATED',
      recordType: 'ServiceCategory',
      recordId: category.id,
      newValues: category,
    });

    return category;
  }

  async findAllCategories(tenantId: string, query: GetCategoriesQueryDto) {
    const { search, includeInactive } = query;

    return this.prisma.serviceCategory.findMany({
      where: {
        tenantId,
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
        ...(!includeInactive ? { isActive: true } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneCategory(tenantId: string, id: string) {
    const category = await this.prisma.serviceCategory.findFirst({
      where: { id, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Service category not found');
    }

    return category;
  }

  async updateCategory(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ) {
    const existing = await this.findOneCategory(tenantId, id);

    const updated = await this.prisma.serviceCategory.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'CATALOG_CATEGORY_UPDATED',
      recordType: 'ServiceCategory',
      recordId: id,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }

  async createItem(tenantId: string, userId: string, dto: CreateItemDto) {
    // Check if category exists
    const category = await this.prisma.serviceCategory.findFirst({
      where: { id: dto.categoryId, tenantId },
    });
    if (!category) {
      throw new NotFoundException('Service category not found');
    }

    // Check if code already exists for tenant
    const existing = await this.prisma.serviceItem.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Service item with code ${dto.code} already exists`,
      );
    }

    const item = await this.prisma.serviceItem.create({
      data: {
        tenantId,
        ...dto,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'CATALOG_ITEM_CREATED',
      recordType: 'ServiceItem',
      recordId: item.id,
      newValues: item,
    });

    return item;
  }

  async findAllItems(tenantId: string, query: GetItemsQueryDto) {
    const { branchId, categoryId, search, includeInactive } = query;

    const items = await this.prisma.serviceItem.findMany({
      where: {
        tenantId,
        ...(categoryId ? { categoryId } : {}),
        ...(!includeInactive ? { isActive: true } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        category: true,
        prices: {
          where: {
            isActive: true,
            ...(branchId ? { branchId } : {}),
          },
          orderBy: { effectiveDate: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Resolve current price
    return items.map((item) => {
      // If branchId is provided, we only expect 1 active price for that branch
      // If not provided, we might have multiple active prices (one per branch)
      const currentPrice = branchId ? item.prices[0]?.amount || null : null;

      return {
        ...item,
        currentPrice,
        // Optional: if no branchId, maybe we don't return price at all or return all branch prices
        prices: branchId ? undefined : item.prices,
      };
    });
  }

  async findOneItem(tenantId: string, id: string) {
    const item = await this.prisma.serviceItem.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        prices: {
          where: { isActive: true },
          orderBy: { effectiveDate: 'desc' },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Service item not found');
    }

    return item;
  }

  async updateItem(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateItemDto,
  ) {
    const existing = await this.findOneItem(tenantId, id);

    if (dto.categoryId) {
      const category = await this.prisma.serviceCategory.findFirst({
        where: { id: dto.categoryId, tenantId },
      });
      if (!category) {
        throw new NotFoundException('Service category not found');
      }
    }

    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.prisma.serviceItem.findFirst({
        where: { tenantId, code: dto.code },
      });
      if (duplicate) {
        throw new ConflictException(
          `Service item with code ${dto.code} already exists`,
        );
      }
    }

    const updated = await this.prisma.serviceItem.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'CATALOG_ITEM_UPDATED',
      recordType: 'ServiceItem',
      recordId: id,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }

  async setPrice(
    tenantId: string,
    userId: string,
    itemId: string,
    dto: SetPriceDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify item exists
      const item = await tx.serviceItem.findFirst({
        where: { id: itemId, tenantId },
      });
      if (!item) {
        throw new NotFoundException('Service item not found');
      }

      // 2. Deactivate old price for this branch if exists
      const existingPrice = await tx.servicePrice.findFirst({
        where: {
          tenantId,
          serviceItemId: itemId,
          branchId: dto.branchId,
          isActive: true,
        },
      });

      if (existingPrice) {
        await tx.servicePrice.update({
          where: { id: existingPrice.id },
          data: {
            isActive: false,
            updatedBy: userId,
          },
        });
      }

      // 3. Create new price record
      const newPrice = await tx.servicePrice.create({
        data: {
          tenantId,
          serviceItemId: itemId,
          branchId: dto.branchId,
          amount: dto.amount,
          effectiveDate: dto.effectiveDate
            ? new Date(dto.effectiveDate)
            : new Date(),
          isActive: true,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 4. Audit log
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'SERVICE_PRICE_UPDATED',
          recordType: 'ServicePrice',
          recordId: newPrice.id,
          oldValues: existingPrice || null,
          newValues: newPrice,
        },
        tx,
      );

      return newPrice;
    });
  }
}
