import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateCategoryDto,
  CreateItemDto,
  SetPriceDto,
  GetItemsQueryDto,
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
    return this.prisma.serviceCategory.create({
      data: {
        tenantId,
        ...dto,
        createdBy: userId,
        updatedBy: userId,
      },
    });
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

    return this.prisma.serviceItem.create({
      data: {
        tenantId,
        ...dto,
        createdBy: userId,
        updatedBy: userId,
      },
    });
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

  async findAllItems(tenantId: string, query: GetItemsQueryDto) {
    const { branchId, categoryId } = query;

    const items = await this.prisma.serviceItem.findMany({
      where: {
        tenantId,
        ...(categoryId ? { categoryId } : {}),
        isActive: true,
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
}
