import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import {
  CreateCategoryDto,
  CreateItemDto,
  SetPriceDto,
  GetItemsQueryDto,
} from './dto/catalog.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('catalog')
@UseGuards(PermissionsGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('categories')
  @RequirePermissions('catalog.manage')
  async createCategory(@Request() req: any, @Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(
      req.user.tenantId,
      req.user.id,
      dto,
    );
  }

  @Post('items')
  @RequirePermissions('catalog.manage')
  async createItem(@Request() req: any, @Body() dto: CreateItemDto) {
    return this.catalogService.createItem(req.user.tenantId, req.user.id, dto);
  }

  @Post('items/:id/prices')
  @RequirePermissions('catalog.manage')
  async setPrice(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: SetPriceDto,
  ) {
    return this.catalogService.setPrice(
      req.user.tenantId,
      req.user.id,
      id,
      dto,
    );
  }

  @Get('items')
  @RequirePermissions('catalog.view', 'catalog.manage')
  async findAllItems(@Request() req: any, @Query() query: GetItemsQueryDto) {
    return this.catalogService.findAllItems(req.user.tenantId, query);
  }
}
