import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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
    const item = await this.prisma.serviceItem.findFirst({
      where: { id: dto.serviceItemId, tenantId },
    });
    if (!item) throw new NotFoundException('Service item not found');

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
          ...(search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          } : {}),
        },
      },
      include: {
        serviceItem: {
          include: {
            category: true,
            prices: { where: { isActive: true }, orderBy: { effectiveDate: 'desc' }, take: 1 },
          },
        },
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrder(tenantId: string, userId: string, dto: { items: { listingId: string, quantity: number }[], shippingAddress: string }) {
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItems = [];

      for (const item of dto.items) {
        const listing = await tx.marketplaceListing.findUnique({ where: { id: item.listingId } });
        if (!listing) throw new NotFoundException(`Listing ${item.listingId} not found`);

        const subtotal = Number(listing.basePrice) * item.quantity;
        totalAmount += subtotal;
        orderItems.push({
          listing: { connect: { id: item.listingId } },
          quantity: item.quantity,
          unitPrice: listing.basePrice || 0,
          subtotal: subtotal,
        });

        try {
          await tx.marketplaceListing.update({
            where: { id: listing.id, stockCount: { gte: item.quantity } },
            data: { stockCount: { decrement: item.quantity } },
          });
        } catch (err) {
          throw new BadRequestException(`Insufficient stock for ${listing.name}`);
        }
      }

      const order = await tx.marketplaceOrder.create({
        data: {
          tenantId,
          buyerId: userId,
          totalAmount,
          status: 'PENDING',
          items: { create: orderItems },
        },
      });

      await this.audit.log({
        tenantId,
        userId,
        eventKey: 'MARKETPLACE_ORDER_CREATED',
        recordType: 'MarketplaceOrder',
        recordId: order.id,
        newValues: order,
      }, tx);

      return order;
    });
  }

  async listBuyerOrders(tenantId: string, userId: string) {
    return this.prisma.marketplaceOrder.findMany({
      where: { tenantId, buyerId: userId },
      include: { items: { include: { listing: true } } },
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
            prices: { where: { isActive: true }, orderBy: { effectiveDate: 'desc' } },
          },
        },
        supplier: true,
      },
    });
    if (!listing) throw new NotFoundException('Marketplace listing not found');
    return listing;
  }

  async moderateListing(tenantId: string, userId: string, id: string, dto: ModerateListingDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.marketplaceListing.findFirst({ where: { id, tenantId } });
      if (!existing) throw new NotFoundException('Marketplace listing not found');

      const updated = await tx.marketplaceListing.update({
        where: { id, tenantId },
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
      }, tx);

      return updated;
    });
  }

  async updateListing(tenantId: string, userId: string, id: string, dto: UpdateListingDto, supplierId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.marketplaceListing.findFirst({ where: { id, tenantId } });
      if (!existing) throw new NotFoundException('Marketplace listing not found');
      if (supplierId && existing.supplierId !== supplierId) throw new ForbiddenException('You do not own this listing');

      const updated = await tx.marketplaceListing.update({
        where: { id, tenantId },
        data: { ...dto },
      });

      await this.audit.log({
        tenantId,
        userId,
        eventKey: 'MARKETPLACE_LISTING_UPDATED',
        recordType: 'MarketplaceListing',
        recordId: id,
        oldValues: existing,
        newValues: updated,
      }, tx);

      return updated;
    });
  }

  async deleteListing(tenantId: string, userId: string, id: string, supplierId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.marketplaceListing.findFirst({ where: { id, tenantId } });
      if (!existing) throw new NotFoundException('Marketplace listing not found');
      if (supplierId && existing.supplierId !== supplierId) throw new ForbiddenException('You do not own this listing');

      await tx.marketplaceListing.delete({ where: { id, tenantId } });

      await this.audit.log({
        tenantId,
        userId,
        eventKey: 'MARKETPLACE_LISTING_DELETED',
        recordType: 'MarketplaceListing',
        recordId: id,
        oldValues: existing,
      }, tx);

      return { success: true };
    });
  }

  async findAllSupplierListings(tenantId: string, supplierId: string) {
    return this.prisma.marketplaceListing.findMany({
      where: { tenantId, supplierId },
      include: { serviceItem: { include: { category: true } } },
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

  async findAllRFQs(tenantId: string) {
    return this.prisma.rFQ.findMany({
      where: { tenantId },
      include: { branch: true, _count: { select: { quotes: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneRFQ(tenantId: string, id: string) {
    const rfq = await this.prisma.rFQ.findFirst({
      where: { id, tenantId },
      include: { branch: true, quotes: { include: { supplier: true } } },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');
    return rfq;
  }

  async findSupplierQuotes(tenantId: string, supplierId: string) {
    return this.prisma.quote.findMany({
      where: { tenantId, supplierId },
      include: { rfq: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createQuote(tenantId: string, userId: string, supplierId: string, dto: CreateQuoteDto) {
    const rfq = await this.prisma.rFQ.findFirst({ where: { id: dto.rfqId, tenantId } });
    if (!rfq) throw new NotFoundException('RFQ not found');

    const quote = await this.prisma.quote.create({
      data: {
        tenantId,
        rfqId: dto.rfqId,
        supplierId,
        amount: dto.totalAmount,
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

  async findSupplierOrders(tenantId: string, supplierId: string) {
    const [salesOrders, purchaseOrders] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where: { tenantId, quote: { supplierId } },
        include: { quote: { include: { rfq: true } }, shipments: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseOrder.findMany({
        where: { tenantId, supplierId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { salesOrders, purchaseOrders };
  }
}
