import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, ReceiveStockDto } from './dto/inventory.dto';
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
}
