import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { DispenseItemDto } from './dto/dispense-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('pharmacy')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Post('prescriptions')
  @RequirePermissions('pharmacy.prescribe')
  async createPrescription(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.pharmacyService.createPrescription(
      req.user.tenantId,
      req.user.userId!,
      dto,
    );
  }

  @Post('prescriptions/:itemId/dispense')
  @RequirePermissions('pharmacy.dispense')
  async dispenseItem(
    @Request() req: AuthenticatedRequest,
    @Param('itemId') itemId: string,
    @Body() dto: DispenseItemDto,
  ) {
    return this.pharmacyService.dispenseItem(
      req.user.tenantId,
      req.user.userId!,
      itemId,
      dto,
    );
  }
}
