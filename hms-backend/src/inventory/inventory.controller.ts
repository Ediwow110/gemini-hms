import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryItemDto,
  ReceiveStockDto,
  UpdateInventoryItemDto,
  AdjustStockDto,
  InventoryStatus,
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';

@UseGuards(PermissionsGuard, BranchGuard)
@Controller('api/v1/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('catalog')
  @RequirePermissions('inventory.item.view')
  @RequireBranchContext()
  getCatalog(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @Query('status') status?: InventoryStatus,
  ) {
    return this.inventoryService.getCatalog(tenantId, branchId, status);
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

  @Patch('items/:id')
  @RequirePermissions('inventory.item.update')
  updateItem(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(tenantId, userId, id, dto);
  }

  @Delete('items/:id')
  @RequirePermissions('inventory.item.deactivate')
  deactivateItem(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.inventoryService.deactivateItem(tenantId, userId, id);
  }

  @Post('items/:id/receive')
  @RequirePermissions('inventory.stock.receive')
  @RequireBranchContext()
  receiveStock(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: ReceiveStockDto,
  ) {
    return this.inventoryService.receiveStock(
      tenantId,
      branchId,
      userId,
      id,
      dto,
    );
  }

  @Get('items/:id/logs')
  @RequirePermissions('inventory.item.view')
  @RequireBranchContext()
  getLogs(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') id: string,
  ) {
    return this.inventoryService.getStockLogs(tenantId, branchId, id);
  }

  @Post('items/:id/dispense')
  @RequirePermissions('inventory.stock.dispense')
  @RequireBranchContext()
  dispenseStock(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Body('orderId') orderId?: string,
  ) {
    return this.inventoryService.dispenseItem(
      tenantId,
      branchId,
      userId,
      id,
      quantity,
      orderId,
    );
  }

  @Get('alerts/low-stock')
  @RequirePermissions('inventory.item.view')
  @RequireBranchContext()
  getLowStockAlerts(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
  ) {
    return this.inventoryService.getLowStockAlerts(tenantId, branchId);
  }

  @Patch('stock/:id/adjust')
  @RequirePermissions('inventory.stock.dispense')
  @RequireBranchContext()
  adjustStock(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(tenantId, branchId, userId, id, dto);
  }
}
