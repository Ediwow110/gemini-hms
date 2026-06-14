import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { ListingStatus } from '@prisma/client';
import {
  CreateListingDto,
  UpdateListingDto,
  ModerateListingDto,
  GetListingsQueryDto,
  CreateQuoteDto,
} from './dto/marketplace.dto';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('marketplace')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // --- Buyer Endpoints ---

  @Get('listings')
  @RequirePermissions('marketplace.buyer.view')
  async findAllBuyer(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetListingsQueryDto,
  ) {
    // Buyers only see approved listings
    return this.marketplaceService.findAllListings(req.user.tenantId, {
      ...query,
      status: ListingStatus.APPROVED,
    });
  }

  @Get('listings/:id')
  @RequirePermissions('marketplace.buyer.view')
  async findOneBuyer(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const listing = await this.marketplaceService.findOneListing(
      req.user.tenantId,
      id,
    );
    return listing;
  }

  // --- Supplier Endpoints ---

  @Get('supplier/listings')
  @RequirePermissions('marketplace.supplier.view')
  async findAllSupplier(@Req() req: AuthenticatedRequest) {
    if (!req.user.supplierId) {
      throw new ForbiddenException('User is not associated with a supplier');
    }
    return this.marketplaceService.findAllSupplierListings(
      req.user.tenantId,
      req.user.supplierId,
    );
  }

  @Post('supplier/listings')
  @RequirePermissions('marketplace.supplier.manage_listing')
  async createSupplierListing(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateListingDto,
  ) {
    if (!req.user.supplierId) {
      throw new ForbiddenException('User is not associated with a supplier');
    }
    return this.marketplaceService.createListing(
      req.user.tenantId,
      req.user.userId!,
      {
        ...dto,
        supplierId: req.user.supplierId,
      },
    );
  }

  @Patch('supplier/listings/:id')
  @RequirePermissions('marketplace.supplier.manage_listing')
  async updateSupplierListing(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    if (!req.user.supplierId) {
      throw new ForbiddenException('User is not associated with a supplier');
    }
    return this.marketplaceService.updateListing(
      req.user.tenantId,
      req.user.userId!,
      id,
      dto,
      req.user.supplierId,
    );
  }

  @Delete('supplier/listings/:id')
  @RequirePermissions('marketplace.supplier.manage_listing')
  async deleteSupplierListing(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    if (!req.user.supplierId) {
      throw new ForbiddenException('User is not associated with a supplier');
    }
    return this.marketplaceService.deleteListing(
      req.user.tenantId,
      req.user.userId!,
      id,
      req.user.supplierId,
    );
  }

  @Get('supplier/catalog-items')
  @RequirePermissions('marketplace.supplier.manage_listing')
  async findAvailableCatalogItems(@Req() req: AuthenticatedRequest) {
    return this.marketplaceService.findAvailableCatalogItems(req.user.tenantId);
  }

  @Get('supplier/rfqs')
  @RequirePermissions('marketplace.supplier.view')
  async findAllSupplierRFQs(@Req() req: AuthenticatedRequest) {
    return this.marketplaceService.findAllRFQs(req.user.tenantId);
  }

  @Get('supplier/rfqs/:id')
  @RequirePermissions('marketplace.supplier.view')
  async findOneSupplierRFQ(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.marketplaceService.findOneRFQ(req.user.tenantId, id);
  }

  @Get('supplier/quotes')
  @RequirePermissions('marketplace.supplier.view')
  async findSupplierQuotes(@Req() req: AuthenticatedRequest) {
    if (!req.user.supplierId) {
      throw new ForbiddenException('User is not associated with a supplier');
    }
    return this.marketplaceService.findSupplierQuotes(
      req.user.tenantId,
      req.user.supplierId,
    );
  }

  @Post('supplier/quotes')
  @RequirePermissions('marketplace.supplier.manage_listing') // Re-using permission for quoting for now
  async createSupplierQuote(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateQuoteDto,
  ) {
    if (!req.user.supplierId) {
      throw new ForbiddenException('User is not associated with a supplier');
    }
    return this.marketplaceService.createQuote(
      req.user.tenantId,
      req.user.userId!,
      req.user.supplierId,
      dto,
    );
  }

  @Get('supplier/orders')
  @RequirePermissions('marketplace.supplier.view')
  async findSupplierOrders(@Req() req: AuthenticatedRequest) {
    if (!req.user.supplierId) {
      throw new ForbiddenException('User is not associated with a supplier');
    }
    return this.marketplaceService.findSupplierOrders(
      req.user.tenantId,
      req.user.supplierId,
    );
  }

  // --- Admin Endpoints ---

  @Get('admin/listings')
  @RequirePermissions('marketplace.admin.view')
  async findAllAdmin(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetListingsQueryDto,
  ) {
    return this.marketplaceService.findAllListings(req.user.tenantId, query);
  }

  @Post('admin/listings')
  @RequirePermissions('marketplace.admin.manage')
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateListingDto,
  ) {
    return this.marketplaceService.createListing(
      req.user.tenantId,
      req.user.userId!,
      dto,
    );
  }

  @Patch('admin/listings/:id/moderate')
  @RequirePermissions('marketplace.admin.manage')
  async moderate(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ModerateListingDto,
  ) {
    return this.marketplaceService.moderateListing(
      req.user.tenantId,
      req.user.userId!,
      id,
      dto,
    );
  }

  @Patch('admin/listings/:id')
  @RequirePermissions('marketplace.admin.manage')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.marketplaceService.updateListing(
      req.user.tenantId,
      req.user.userId!,
      id,
      dto,
    );
  }
}
