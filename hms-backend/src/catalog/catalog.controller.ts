import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateItemDto,
  UpdateItemDto,
  SetPriceDto,
  GetItemsQueryDto,
  GetCategoriesQueryDto,
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

  @Get('categories')
  @RequirePermissions('catalog.service.view', 'catalog.manage')
  async findAllCategories(
    @Request() req: any,
    @Query() query: GetCategoriesQueryDto,
  ) {
    return this.catalogService.findAllCategories(req.user.tenantId, query);
  }

  @Get('categories/:id')
  @RequirePermissions('catalog.service.view', 'catalog.manage')
  async findOneCategory(@Request() req: any, @Param('id') id: string) {
    return this.catalogService.findOneCategory(req.user.tenantId, id);
  }

  @Patch('categories/:id')
  @RequirePermissions('catalog.manage')
  async updateCategory(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.catalogService.updateCategory(
      req.user.tenantId,
      req.user.id,
      id,
      dto,
    );
  }

  @Post('items')
  @RequirePermissions('catalog.manage')
  async createItem(@Request() req: any, @Body() dto: CreateItemDto) {
    return this.catalogService.createItem(req.user.tenantId, req.user.id, dto);
  }

  @Get('items')
  @RequirePermissions('catalog.service.view', 'catalog.manage')
  async findAllItems(@Request() req: any, @Query() query: GetItemsQueryDto) {
    return this.catalogService.findAllItems(req.user.tenantId, query);
  }

  @Get('items/:id')
  @RequirePermissions('catalog.service.view', 'catalog.manage')
  async findOneItem(@Request() req: any, @Param('id') id: string) {
    return this.catalogService.findOneItem(req.user.tenantId, id);
  }

  @Patch('items/:id')
  @RequirePermissions('catalog.manage')
  async updateItem(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.catalogService.updateItem(
      req.user.tenantId,
      req.user.id,
      id,
      dto,
    );
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
}
