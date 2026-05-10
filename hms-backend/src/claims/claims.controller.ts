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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
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
  getClaims(@GetUser('tenantId') tenantId: string) {
    return this.claimsService.getClaims(tenantId);
  }

  @Post()
  @RequirePermissions('billing.claim.create')
  createClaim(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateClaimDto,
  ) {
    return this.claimsService.createClaim(tenantId, userId, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('billing.claim.process')
  updateStatus(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClaimStatusDto,
  ) {
    return this.claimsService.updateStatus(tenantId, userId, id, dto);
  }
}
