import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ErxService } from './erx.service';
import { BedManagementService } from './bed-management.service';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';
import {
  ScreenInteractionsDto,
  AssignBedDto,
} from './dto/advanced-clinical.dto';

@UseGuards(RolesGuard)
@Controller('api/v1/clinical')
@Roles('Super Admin', 'Branch Admin', 'DOCTOR', 'Doctor', 'NURSE', 'Nurse')
export class AdvancedClinicalController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly erxService: ErxService,
    private readonly bedService: BedManagementService,
  ) {}

  @Get('cpt-codes')
  async searchCptCodes(
    @GetUser('tenantId') tenantId: string,
    @Query('search') search?: string,
  ) {
    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.cptCode.findMany({
      where,
      orderBy: { code: 'asc' },
    });
  }

  @Post('erx/screen-interactions')
  async screenInteractions(
    @GetUser('tenantId') tenantId: string,
    @Body() dto: ScreenInteractionsDto,
  ) {
    // Note: ErxService.screenDrugInteractions doesn't use tenantId right now,
    // but we pass it anyway for consistency and future-proofing.
    return this.erxService.screenDrugInteractions(
      tenantId,
      dto.patientId,
      dto.medications,
    );
  }

  @Post('erx/transmit/:prescriptionId')
  async transmitPrescription(
    @GetUser() user: RequestUser,
    @Param('prescriptionId') prescriptionId: string,
  ) {
    return this.erxService.transmitPrescription(user.tenantId, prescriptionId);
  }

  @Get('erx/transmission/:transmissionId/status')
  async getTransmissionStatus(
    @GetUser('tenantId') tenantId: string,
    @Param('transmissionId') transmissionId: string,
  ) {
    return this.erxService.getTransmissionStatus(tenantId, transmissionId);
  }

  @Post('beds/assign')
  async assignBed(@GetUser() user: RequestUser, @Body() dto: AssignBedDto) {
    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }
    return this.bedService.assignBed(
      user.tenantId,
      user.branchId || 'superadmin-branch',
      dto.patientId,
      dto.wardId,
      dto.bedNumber,
    );
  }

  @Post('beds/release/:bedId')
  async releaseBed(
    @GetUser() user: RequestUser,
    @Param('bedId') bedId: string,
  ) {
    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }
    return this.bedService.releaseBed(
      user.tenantId,
      user.branchId || 'superadmin-branch',
      bedId,
    );
  }

  @Get('beds/occupancy')
  async getBedOccupancy(@GetUser() user: RequestUser) {
    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }
    return this.bedService.getBedOccupancy(
      user.tenantId,
      user.branchId || 'superadmin-branch',
    );
  }
}
