import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { CreateClaimDto, UpdateClaimStatusDto } from './dto/claims.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';

@UseGuards(PermissionsGuard, BranchGuard)
@Controller('api/v1/claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get('partners')
  @RequirePermissions('billing.claim.view')
  getPartners(@GetUser('tenantId') tenantId: string) {
    return this.claimsService.getHmoPartners(tenantId);
  }

  @Get()
  @RequirePermissions('billing.claim.view')
  @RequireBranchContext()
  getClaims(
    @GetUser('tenantId') tenantId: string,
    @GetUser() user: RequestUser,
  ) {
    return this.claimsService.getClaims(tenantId, user);
  }

  @Post()
  @RequirePermissions('billing.claim.create')
  @RequireBranchContext()
  createClaim(
    @GetUser('tenantId') tenantId: string,
    @GetUser() user: RequestUser,
    @Body() dto: CreateClaimDto,
  ) {
    return this.claimsService.createClaim(tenantId, user, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('billing.claim.process')
  @RequireBranchContext()
  updateStatus(
    @GetUser('tenantId') tenantId: string,
    @GetUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateClaimStatusDto,
  ) {
    return this.claimsService.updateStatus(tenantId, user, id, dto);
  }
}
