import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { PatientPortalService } from './patient-portal.service';
import { PatientLoginDto } from './dto/patient-portal-auth.dto';
import { PatientJwtGuard } from './guards/patient-jwt.guard';
import { PatientCsrfGuard } from './guards/patient-csrf.guard';
import { GetPatientUser } from './decorators/get-patient-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { Response } from 'express';

const PATIENT_COOKIE_OPTIONS = (isProd: boolean) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict' as const,
  path: '/patient-portal',
});

const PATIENT_CSRF_COOKIE_OPTIONS = (isProd: boolean) => ({
  httpOnly: false,
  secure: isProd,
  sameSite: 'strict' as const,
  path: '/patient-portal',
});

@Controller('patient-portal')
@Public()
export class PatientPortalController {
  constructor(private readonly portalService: PatientPortalService) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: PatientLoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.portalService.login(dto);
    const isProd = process.env.NODE_ENV === 'production';

    // Set httpOnly auth cookie for browser clients (scoped to /patient-portal)
    res.cookie(
      'patient_token',
      result.accessToken,
      PATIENT_COOKIE_OPTIONS(isProd),
    );

    // Set non-httpOnly CSRF cookie (readable by JS for double-submit pattern)
    const csrfToken = crypto.randomUUID();
    res.cookie('patient_csrf', csrfToken, PATIENT_CSRF_COOKIE_OPTIONS(isProd));

    // Browser-safe response: no accessToken exposed to JS
    return {
      patientId: result.patientId,
      email: result.email,
    };
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('auth/logout')
  @UseGuards(PatientCsrfGuard)
  async logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('patient_token', { path: '/patient-portal' });
    res.clearCookie('patient_csrf', { path: '/patient-portal' });
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
