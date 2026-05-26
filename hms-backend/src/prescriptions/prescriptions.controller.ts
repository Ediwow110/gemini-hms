import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BranchGuard } from '../auth/guards/branch.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireBranchContext } from '../auth/decorators/branch-context.decorator';

@UseGuards(PermissionsGuard, BranchGuard)
@Controller('api/v1/prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @RequirePermissions('doctor.prescription.create')
  @RequireBranchContext()
  create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('branchId') branchId: string,
    @GetUser('userId') userId: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.prescriptionsService.create(tenantId, branchId, userId, dto);
  }

  @Get()
  @RequirePermissions('doctor.prescription.view')
  findByPatient(
    @GetUser('tenantId') tenantId: string,
    @Query('patientId') patientId: string,
  ) {
    if (!patientId) {
      return [];
    }
    return this.prescriptionsService.findByPatient(tenantId, patientId);
  }
}
