import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { LisService } from './lis.service';
import {
  CreateLabOrderDto,
  CreateSpecimenDto,
  UpdateSpecimenStatusDto,
} from './dto/lis.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('lis')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LisController {
  constructor(private readonly lisService: LisService) {}

  @Post('orders')
  @RequirePermissions('lab.order.create')
  @RequireBranchContext()
  async createLabOrder(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Body() dto: CreateLabOrderDto,
  ) {
    return this.lisService.createLabOrder(tenantId, userId, branchId, dto);
  }

  @Post('orders/:id/specimens')
  @RequirePermissions('lab.specimen.create')
  @RequireBranchContext()
  async addSpecimen(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') labOrderId: string,
    @Body() dto: CreateSpecimenDto,
  ) {
    return this.lisService.addSpecimen(
      tenantId,
      userId,
      branchId,
      labOrderId,
      dto,
    );
  }

  @Patch('specimens/:id/status')
  @RequirePermissions('lab.specimen.update')
  @RequireBranchContext()
  async updateSpecimenStatus(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @GetUser('branchId') branchId: string,
    @Param('id') specimenId: string,
    @Body() dto: UpdateSpecimenStatusDto,
  ) {
    return this.lisService.updateSpecimenStatus(
      tenantId,
      userId,
      branchId,
      specimenId,
      dto,
    );
  }
}
