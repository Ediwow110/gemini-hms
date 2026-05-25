import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ListingStatus } from '@prisma/client';
import {
  CreateListingDto,
  UpdateListingDto,
  ModerateListingDto,
  GetListingsQueryDto,
} from './dto/marketplace.dto';

@Injectable()
export class MarketplaceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createListing(tenantId: string, userId: string, dto: CreateListingDto) {
    // Verify service item exists
    const item = await this.prisma.serviceItem.findFirst({
      where: { id: dto.serviceItemId, tenantId },
    });
    if (!item) {
      throw new NotFoundException('Service item not found');
    }

    const listing = await this.prisma.marketplaceListing.create({
      data: {
        tenantId,
        serviceItemId: dto.serviceItemId,
        supplierId: dto.supplierId,
        description: dto.description,
        priceOverride: dto.priceOverride,
        status: ListingStatus.PENDING_APPROVAL,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'MARKETPLACE_LISTING_CREATED',
      recordType: 'MarketplaceListing',
      recordId: listing.id,
      newValues: listing,
    });

    return listing;
  }

  async findAllListings(tenantId: string, query: GetListingsQueryDto) {
    const { status, categoryId, search } = query;

    return this.prisma.marketplaceListing.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
        serviceItem: {
          ...(categoryId ? { categoryId } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { code: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
      },
      include: {
        serviceItem: {
          include: {
            category: true,
            prices: {
              where: { isActive: true },
              orderBy: { effectiveDate: 'desc' },
              take: 1,
            },
          },
        },
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneListing(tenantId: string, id: string) {
    const listing = await this.prisma.marketplaceListing.findFirst({
      where: { id, tenantId },
      include: {
        serviceItem: {
          include: {
            category: true,
            prices: {
              where: { isActive: true },
              orderBy: { effectiveDate: 'desc' },
            },
          },
        },
        supplier: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Marketplace listing not found');
    }

    return listing;
  }

  async moderateListing(
    tenantId: string,
    userId: string,
    id: string,
    dto: ModerateListingDto,
  ) {
    const existing = await this.findOneListing(tenantId, id);

    const updated = await this.prisma.marketplaceListing.update({
      where: { id },
      data: {
        status: dto.status,
        rejectionReason: dto.rejectionReason,
        approvedAt: dto.status === ListingStatus.APPROVED ? new Date() : null,
        approvedById: dto.status === ListingStatus.APPROVED ? userId : null,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'MARKETPLACE_LISTING_MODERATED',
      recordType: 'MarketplaceListing',
      recordId: id,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }

  async updateListing(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateListingDto,
  ) {
    const existing = await this.findOneListing(tenantId, id);

    const updated = await this.prisma.marketplaceListing.update({
      where: { id },
      data: {
        ...dto,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'MARKETPLACE_LISTING_UPDATED',
      recordType: 'MarketplaceListing',
      recordId: id,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }
}
