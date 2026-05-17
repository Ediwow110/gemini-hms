import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ErxService } from './erx.service';
import { BedManagementService } from './bed-management.service';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

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
    @Body('patientId') patientId: string,
    @Body('medications') medications: string[],
  ) {
    return this.erxService.screenDrugInteractions(patientId, medications);
  }

  @Post('erx/transmit/:prescriptionId')
  async transmitPrescription(@Param('prescriptionId') prescriptionId: string) {
    return this.erxService.transmitPrescription(prescriptionId);
  }

  @Get('erx/transmission/:transmissionId/status')
  async getTransmissionStatus(@Param('transmissionId') transmissionId: string) {
    return this.erxService.getTransmissionStatus(transmissionId);
  }

  @Post('beds/assign')
  async assignBed(
    @Body('patientId') patientId: string,
    @Body('wardId') wardId: string,
    @Body('bedNumber') bedNumber: string,
  ) {
    return this.bedService.assignBed(patientId, wardId, bedNumber);
  }

  @Post('beds/release/:bedId')
  async releaseBed(@Param('bedId') bedId: string) {
    return this.bedService.releaseBed(bedId);
  }

  @Get('beds/occupancy')
  async getBedOccupancy() {
    return this.bedService.getBedOccupancy();
  }
}
