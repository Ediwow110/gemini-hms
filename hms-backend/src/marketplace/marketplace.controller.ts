import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
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
} from './dto/marketplace.dto';

@Controller('marketplace')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // --- Buyer Endpoints ---

  @Get('listings')
  @RequirePermissions('marketplace.buyer.view')
  async findAllBuyer(@Req() req: any, @Query() query: GetListingsQueryDto) {
    // Buyers only see approved listings
    return this.marketplaceService.findAllListings(req.user.tenantId, {
      ...query,
      status: ListingStatus.APPROVED,
    });
  }

  @Get('listings/:id')
  @RequirePermissions('marketplace.buyer.view')
  async findOneBuyer(@Req() req: any, @Param('id') id: string) {
    const listing = await this.marketplaceService.findOneListing(
      req.user.tenantId,
      id,
    );
    // Optional: if listing is not approved, maybe restrict for non-admins
    return listing;
  }

  // --- Admin Endpoints ---

  @Get('admin/listings')
  @RequirePermissions('marketplace.admin.view')
  async findAllAdmin(@Req() req: any, @Query() query: GetListingsQueryDto) {
    return this.marketplaceService.findAllListings(req.user.tenantId, query);
  }

  @Post('admin/listings')
  @RequirePermissions('marketplace.admin.manage')
  async create(@Req() req: any, @Body() dto: CreateListingDto) {
    return this.marketplaceService.createListing(
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }

  @Patch('admin/listings/:id/moderate')
  @RequirePermissions('marketplace.admin.manage')
  async moderate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ModerateListingDto,
  ) {
    return this.marketplaceService.moderateListing(
      req.user.tenantId,
      req.user.userId,
      id,
      dto,
    );
  }

  @Patch('admin/listings/:id')
  @RequirePermissions('marketplace.admin.manage')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.marketplaceService.updateListing(
      req.user.tenantId,
      req.user.userId,
      id,
      dto,
    );
  }
}
