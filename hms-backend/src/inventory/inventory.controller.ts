import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryItemDto,
  ReceiveStockDto,
  AdjustStockDto,
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard, BranchGuard)
@Controller('api/v1/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('catalog')
  @RequirePermissions('inventory.item.view')
  @RequireBranchContext()
  getCatalog(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
  ) {
    return this.inventoryService.getCatalog(tenantId, branchId);
  }

  @Get('items/:id')
  @RequirePermissions('inventory.item.view')
  getItem(@GetUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.inventoryService.getItem(tenantId, id);
  }

  @Post('items')
  @RequirePermissions('inventory.item.create')
  @RequireBranchContext()
  createItem(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateInventoryItemDto,
  ) {
    return this.inventoryService.createItem(tenantId, branchId, userId, dto);
  }

  @Post('receiving')
  @RequirePermissions('inventory.receive')
  @RequireBranchContext()
  receiveStock(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @GetUser('userId') userId: string,
    @Body() dto: ReceiveStockDto,
  ) {
    return this.inventoryService.receiveStock(tenantId, branchId, userId, dto);
  }

  @Post('adjustments')
  @RequirePermissions('inventory.adjust')
  @RequireBranchContext()
  adjustStock(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @GetUser('userId') userId: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(tenantId, branchId, userId, dto);
  }
}
