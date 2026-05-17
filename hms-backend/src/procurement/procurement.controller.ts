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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(RolesGuard)
@Controller('api/v1/procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post('suppliers')
  @Roles('Super Admin', 'Branch Admin', 'HR Manager', 'HR Staff', 'Branch Manager', 'Inventory Staff', 'Staff')
  createSupplier(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.procurementService.createSupplier(tenantId, userId, dto);
  }

  @Post('purchase-requests')
  @Roles('Super Admin', 'Branch Admin', 'Inventory Staff', 'Staff', 'Doctor', 'Nurse', 'HR Staff')
  createPurchaseRequest(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreatePurchaseRequestDto,
  ) {
    return this.procurementService.createPurchaseRequest(tenantId, userId, dto);
  }

  @Patch('purchase-requests/:id/approve')
  @Roles('Super Admin', 'Branch Admin', 'Branch Manager')
  approvePurchaseRequest(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.procurementService.approvePurchaseRequest(tenantId, userId, id);
  }

  @Post('purchase-orders')
  @Roles('Super Admin', 'Branch Admin', 'Branch Manager')
  createPurchaseOrder(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.procurementService.createPurchaseOrder(tenantId, userId, dto);
  }

  @Post('purchase-orders/:id/receive')
  @Roles('Super Admin', 'Branch Admin', 'Inventory Staff', 'Staff')
  receivePurchaseOrder(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
  ) {
    return this.procurementService.receivePurchaseOrder(tenantId, userId, id, dto);
  }
}
