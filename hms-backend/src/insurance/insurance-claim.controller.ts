import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { InsuranceClaimService } from './insurance-claim.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('api/v1/insurance/claims')
@UseGuards(RolesGuard)
@Roles('Super Admin', 'Branch Admin', 'Cashier')
export class InsuranceClaimController {
  constructor(private readonly claimService: InsuranceClaimService) {}

  @Post()
  async createClaim(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @Body()
    dto: { invoiceId: string; providerCode: string; claimedAmount: number },
  ) {
    return this.claimService.createClaim(tenantId, branchId, dto);
  }

  @Get(':id')
  async getClaim(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.claimService.getClaim(tenantId, id);
  }

  @Post(':id/submit')
  async submitClaim(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.claimService.submitClaim(tenantId, id);
  }

  @Patch(':id/status')
  async updateStatus(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body()
    dto: {
      status: 'ACCEPTED' | 'REJECTED' | 'PAID';
      settledAmount?: number;
      rejectionReason?: string;
    },
  ) {
    return this.claimService.updateClaimStatus(tenantId, id, dto);
  }
}
