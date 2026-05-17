import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PatientPortalService } from './patient-portal.service';
import { PatientLoginDto } from './dto/patient-portal-auth.dto';
import { PatientJwtGuard } from './guards/patient-jwt.guard';
import { GetPatientUser } from './decorators/get-patient-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('patient-portal')
@Public()
export class PatientPortalController {
  constructor(private readonly portalService: PatientPortalService) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: PatientLoginDto) {
    return this.portalService.login(dto);
  }

  @Get('profile')
  @UseGuards(PatientJwtGuard)
  async getProfile(
    @GetPatientUser('tenantId') tenantId: string,
    @GetPatientUser('patientId') patientId: string,
  ) {
    return this.portalService.getProfile(tenantId, patientId);
  }

  @Get('lab-results')
  @UseGuards(PatientJwtGuard)
  async getLabResults(
    @GetPatientUser('tenantId') tenantId: string,
    @GetPatientUser('patientId') patientId: string,
  ) {
    return this.portalService.getReleasedLabResults(tenantId, patientId);
  }

  @Get('invoices')
  @UseGuards(PatientJwtGuard)
  async getInvoices(
    @GetPatientUser('tenantId') tenantId: string,
    @GetPatientUser('patientId') patientId: string,
  ) {
    return this.portalService.getInvoices(tenantId, patientId);
  }

  @Get('prescriptions')
  @UseGuards(PatientJwtGuard)
  async getPrescriptions(
    @GetPatientUser('tenantId') tenantId: string,
    @GetPatientUser('patientId') patientId: string,
  ) {
    return this.portalService.getPrescriptions(tenantId, patientId);
  }
}
