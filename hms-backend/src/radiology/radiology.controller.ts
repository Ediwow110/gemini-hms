import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  NotImplementedException,
} from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';

@Controller('api/v1/radiology')
@UseGuards(PermissionsGuard, BranchGuard)
export class RadiologyController {
  @Get('orders')
  @RequirePermissions('lab.result.view')
  @RequireBranchContext()
  listOrders() {
    return [];
  }

  @Post('orders/:id/finalize')
  @RequirePermissions('lab.result.encode')
  @RequireBranchContext()
  finalizeOrder(
    @Param('id') _id: string,
    @Body() _body: Record<string, unknown>,
  ) {
    throw new NotImplementedException(
      'Radiology report finalization is not implemented in this release.',
    );
  }
}