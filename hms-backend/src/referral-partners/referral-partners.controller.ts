import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReferralPartnersService } from './referral-partners.service';
import {
  CreateReferrerDto,
  CreateReferralRecordDto,
  UpdateReferralRecordStatusDto,
} from './dto/referral-partner.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(RolesGuard)
@Controller('api/v1/referrals')
export class ReferralPartnersController {
  constructor(
    private readonly referralPartnersService: ReferralPartnersService,
  ) {}

  @Post('referrers')
  @Roles('Super Admin', 'Branch Admin')
  createReferrer(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateReferrerDto,
  ) {
    return this.referralPartnersService.createReferrer(tenantId, userId, dto);
  }

  @Get('referrers/:id')
  @Roles('Super Admin', 'Branch Admin', 'Doctor', 'Nurse', 'Staff')
  getReferrerById(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.referralPartnersService.getReferrerById(tenantId, id);
  }

  @Post('records')
  @Roles('Super Admin', 'Branch Admin', 'Doctor', 'Nurse', 'Staff')
  createReferralRecord(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreateReferralRecordDto,
  ) {
    return this.referralPartnersService.createReferralRecord(
      tenantId,
      userId,
      dto,
    );
  }

  @Get('records')
  @Roles('Super Admin', 'Branch Admin', 'Doctor', 'Nurse', 'Staff')
  getReferralRecords(
    @GetUser('tenantId') tenantId: string,
    @Query('referrerId') referrerId?: string,
    @Query('status') status?: string,
  ) {
    return this.referralPartnersService.getReferralRecords(
      tenantId,
      referrerId,
      status,
    );
  }

  @Patch('records/:id/status')
  @Roles('Super Admin', 'Branch Admin')
  updateReferralRecordStatus(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReferralRecordStatusDto,
  ) {
    return this.referralPartnersService.updateReferralRecordStatus(
      tenantId,
      userId,
      id,
      dto.status,
    );
  }
}
