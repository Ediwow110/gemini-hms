import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import {
  CreateSupplierDto,
  CreatePurchaseRequestDto,
  CreatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  CreateRFQDto,
} from './dto/procurement.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';

@UseGuards(PermissionsGuard)
@Controller('api/v1/procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('suppliers/performance')
  @RequirePermissions('procurement.supplier.view')
  getVendorPerformance(@GetUser() user: RequestUser) {
    return this.procurementService.getVendorPerformance(user);
  }

  @Post('rfqs')
  @RequirePermissions('procurement.request.create')
  createRFQ(@GetUser() user: RequestUser, @Body() dto: CreateRFQDto) {
    return this.procurementService.createRFQ(user, dto);
  }

  @Get('rfqs')
  @RequirePermissions('procurement.request.view')
  listRFQs(@GetUser() user: RequestUser, @Query('status') status?: string) {
    return this.procurementService.listRFQs(user, { status });
  }

  @Post('rfqs/:id/quotes')
  @RequirePermissions('procurement.supplier.manage')
  submitQuote(
    @GetUser() user: RequestUser,
    @Param('id') rfqId: string,
    @Body() dto: any,
  ) {
    return this.procurementService.submitQuote(user, rfqId, dto);
  }

  @Get('rfqs/:id/quotes')
  @RequirePermissions('procurement.request.view')
  listQuotes(@GetUser() user: RequestUser, @Param('id') rfqId: string) {
    return this.procurementService.listQuotes(user, rfqId);
  }

  @Post('suppliers')
  @RequirePermissions('procurement.supplier.manage')
  createSupplier(@GetUser() user: RequestUser, @Body() dto: CreateSupplierDto) {
    return this.procurementService.createSupplier(user, dto);
  }

  @Get('suppliers')
  @RequirePermissions('procurement.supplier.view')
  listSuppliers(
    @GetUser() user: RequestUser,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.procurementService.listSuppliers(user, { search, status });
  }

  @Post('purchase-requests')
  @RequirePermissions('procurement.request.create')
  createPurchaseRequest(
    @GetUser() user: RequestUser,
    @Body() dto: CreatePurchaseRequestDto,
  ) {
    return this.procurementService.createPurchaseRequest(user, dto);
  }

  @Get('purchase-requests')
  @RequirePermissions('procurement.request.view')
  listPurchaseRequests(
    @GetUser() user: RequestUser,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.procurementService.listPurchaseRequests(user, {
      status,
      branchId,
    });
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

  @Get('purchase-orders')
  @RequirePermissions('procurement.po.view')
  listPurchaseOrders(
    @GetUser() user: RequestUser,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.procurementService.listPurchaseOrders(user, {
      status,
      branchId,
    });
  }

  @Get('receiving')
  @RequirePermissions('procurement.receiving.post')
  listReceivingRecords(
    @GetUser() user: RequestUser,
    @Query('branchId') branchId?: string,
  ) {
    return this.procurementService.listReceivingRecords(user, { branchId });
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
