import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Get,
} from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import {
  CreateSupplierDto,
  CreatePurchaseRequestDto,
  CreatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
} from './dto/procurement.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('api/v1/procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post('suppliers')
  @RequirePermissions('procurement.supplier.manage')
  createSupplier(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.procurementService.createSupplier(tenantId, userId, dto);
  }

  @Post('purchase-requests')
  @RequirePermissions('procurement.request.create')
  createPurchaseRequest(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreatePurchaseRequestDto,
  ) {
    return this.procurementService.createPurchaseRequest(tenantId, userId, dto);
  }

  @Patch('purchase-requests/:id/approve')
  @RequirePermissions('procurement.request.approve')
  approvePurchaseRequest(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.procurementService.approvePurchaseRequest(tenantId, userId, id);
  }

  @Post('purchase-orders')
  @RequirePermissions('procurement.po.create')
  createPurchaseOrder(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.procurementService.createPurchaseOrder(tenantId, userId, dto);
  }

  @Post('purchase-orders/:id/receive')
  @RequirePermissions('procurement.receiving.post')
  receivePurchaseOrder(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
  ) {
    return this.procurementService.receivePurchaseOrder(
      tenantId,
      userId,
      id,
      dto,
    );
  }
}
