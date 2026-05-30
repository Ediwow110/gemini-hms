import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
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
import type { RequestUser } from '../common/types/authenticated-request.type';

@UseGuards(PermissionsGuard)
@Controller('api/v1/procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post('suppliers')
  @RequirePermissions('procurement.supplier.manage')
  createSupplier(@GetUser() user: RequestUser, @Body() dto: CreateSupplierDto) {
    return this.procurementService.createSupplier(user, dto);
  }

  @Post('purchase-requests')
  @RequirePermissions('procurement.request.create')
  createPurchaseRequest(
    @GetUser() user: RequestUser,
    @Body() dto: CreatePurchaseRequestDto,
  ) {
    return this.procurementService.createPurchaseRequest(user, dto);
  }

  @Patch('purchase-requests/:id/approve')
  @RequirePermissions('procurement.request.approve')
  approvePurchaseRequest(
    @GetUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.procurementService.approvePurchaseRequest(user, id);
  }

  @Post('purchase-orders')
  @RequirePermissions('procurement.po.create')
  createPurchaseOrder(
    @GetUser() user: RequestUser,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.procurementService.createPurchaseOrder(user, dto);
  }

  @Post('purchase-orders/:id/receive')
  @RequirePermissions('procurement.receiving.post')
  receivePurchaseOrder(
    @GetUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
  ) {
    return this.procurementService.receivePurchaseOrder(user, id, dto);
  }
}
