import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ListingStatus, QuoteStatus } from '@prisma/client';
import {
  CreateListingDto,
  UpdateListingDto,
  ModerateListingDto,
  GetListingsQueryDto,
  CreateQuoteDto,
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
    const { status, categoryId, search, supplierId } = query;

    return this.prisma.marketplaceListing.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
        ...(supplierId ? { supplierId } : {}),
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
    supplierId?: string,
  ) {
    const existing = await this.findOneListing(tenantId, id);

    if (supplierId && existing.supplierId !== supplierId) {
      throw new ForbiddenException('You do not own this listing');
    }

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

  async deleteListing(
    tenantId: string,
    userId: string,
    id: string,
    supplierId?: string,
  ) {
    const existing = await this.findOneListing(tenantId, id);

    if (supplierId && existing.supplierId !== supplierId) {
      throw new ForbiddenException('You do not own this listing');
    }

    await this.prisma.marketplaceListing.delete({
      where: { id },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'MARKETPLACE_LISTING_DELETED',
      recordType: 'MarketplaceListing',
      recordId: id,
      oldValues: existing,
    });

    return { success: true };
  }

  // --- Supplier Specific Methods ---

  async findAllSupplierListings(tenantId: string, supplierId: string) {
    return this.prisma.marketplaceListing.findMany({
      where: {
        tenantId,
        supplierId,
      },
      include: {
        serviceItem: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findAvailableCatalogItems(tenantId: string) {
    return this.prisma.serviceItem.findMany({
      where: { tenantId, isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  // --- RFQ and Quote Methods ---

  async findAllRFQs(tenantId: string) {
    return this.prisma.rFQ.findMany({
      where: { tenantId },
      include: {
        branch: true,
        _count: {
          select: { quotes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneRFQ(tenantId: string, id: string) {
    const rfq = await this.prisma.rFQ.findFirst({
      where: { id, tenantId },
      include: {
        branch: true,
        quotes: {
          include: { supplier: true },
        },
      },
    });

    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }

    return rfq;
  }

  async findSupplierQuotes(tenantId: string, supplierId: string) {
    return this.prisma.quote.findMany({
      where: { tenantId, supplierId },
      include: {
        rfq: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createQuote(
    tenantId: string,
    userId: string,
    supplierId: string,
    dto: CreateQuoteDto,
  ) {
    // Verify RFQ exists
    const rfq = await this.prisma.rFQ.findFirst({
      where: { id: dto.rfqId, tenantId },
    });
    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }

    const quote = await this.prisma.quote.create({
      data: {
        tenantId,
        rfqId: dto.rfqId,
        supplierId,
        totalAmount: dto.totalAmount,
        status: QuoteStatus.SENT,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'QUOTE_SUBMITTED',
      recordType: 'Quote',
      recordId: quote.id,
      newValues: quote,
    });

    return quote;
  }

  // --- Order Visibility ---

  async findSupplierOrders(tenantId: string, supplierId: string) {
    // A supplier can see SalesOrders linked to their Quotes
    // and PurchaseOrders linked directly to them.

    const [salesOrders, purchaseOrders] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where: {
          tenantId,
          quote: { supplierId },
        },
        include: {
          quote: {
            include: { rfq: true },
          },
          shipments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseOrder.findMany({
        where: {
          tenantId,
          supplierId,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { salesOrders, purchaseOrders };
  }
}
