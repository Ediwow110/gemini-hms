import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, ReceiveStockDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('catalog')
  @RequirePermissions('inventory.item.view')
  getCatalog(@GetUser('tenantId') tenantId: string) {
    return this.inventoryService.getCatalog(tenantId);
  }

  @Post('items')
  @RequirePermissions('inventory.item.create')
  createItem(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateInventoryItemDto,
  ) {
    return this.inventoryService.createItem(tenantId, userId, dto);
  }

  @Post('items/:id/receive')
  @RequirePermissions('inventory.stock.receive')
  receiveStock(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: ReceiveStockDto,
  ) {
    return this.inventoryService.receiveStock(tenantId, userId, id, dto);
  }

  @Get('items/:id/logs')
  @RequirePermissions('inventory.item.view')
  getLogs(@GetUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.inventoryService.getStockLogs(tenantId, id);
  }

  @Post('items/:id/dispense')
  @RequirePermissions('inventory.stock.dispense')
  dispenseStock(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Body('orderId') orderId?: string,
  ) {
    return this.inventoryService.dispenseItem(
      tenantId,
      userId,
      id,
      quantity,
      orderId,
    );
  }

  @Get('alerts/low-stock')
  @RequirePermissions('inventory.item.view')
  getLowStockAlerts(@GetUser('tenantId') tenantId: string) {
    return this.inventoryService.getLowStockAlerts(tenantId);
  }
}
