import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { DispensePrescriptionDto } from './dto/dispense-prescription.dto';
import {
  PharmacyPrescriptionQueueDto,
  DispenseResultDto,
} from './dto/pharmacy-queue.dto';
import type { RequestUser } from '../common/types/authenticated-request.type';

@Controller('api/v1/pharmacy')
@UseGuards(RolesGuard)
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Get('drugs')
  @Roles('Pharmacist', 'Branch Admin', 'Super Admin')
  async getDrugCatalog(@GetUser() user: RequestUser) {
    return this.pharmacyService.getDrugCatalog(
      user.tenantId,
      user.branchId,
      user,
    );
  }

  @Get('prescriptions')
  @Roles('Pharmacist', 'Branch Admin', 'Super Admin')
  async getPrescriptionQueue(
    @Query('status') status: string | undefined,
    @GetUser() user: RequestUser,
  ): Promise<PharmacyPrescriptionQueueDto[]> {
    return this.pharmacyService.getPrescriptionQueue(
      user.tenantId,
      user.branchId,
      user,
      status,
    );
  }

  @Post('prescriptions/:id/dispense')
  @Roles('Pharmacist', 'Branch Admin', 'Super Admin')
  async dispenseMedication(
    @Param('id') id: string,
    @Body() dto: DispensePrescriptionDto,
    @GetUser() user: RequestUser,
  ): Promise<DispenseResultDto> {
    return this.pharmacyService.dispenseMedication(
      id,
      user.tenantId,
      user,
      dto,
    );
  }
}
