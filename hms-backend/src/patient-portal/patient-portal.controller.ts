import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { PatientPortalService } from './patient-portal.service';
import { PatientLoginDto } from './dto/patient-portal-auth.dto';
import { CreateRefillRequestDto } from './dto/refill-request.dto';
import { CreateMedicalRecordRequestDto } from './dto/medical-record-request.dto';
import { PatientJwtGuard } from './guards/patient-jwt.guard';
import { PatientCsrfGuard } from './guards/patient-csrf.guard';
import { GetPatientUser } from './decorators/get-patient-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { DocumentGeneratorService } from './services/document-generator.service';
import type { Response } from 'express';

// Default sameSite is 'strict' for production security.
// Override via COOKIE_SAME_SITE env var (e.g. 'none' for split-origin staging).
// NOTE: 'lax' only sends cookies for top-level GET navigations — it does NOT
// enable cross-origin fetch/XHR cookie sending. Use 'none' for cross-origin auth
// (requires secure:true). CSRF token mechanism remains active as defense-in-depth.
// WARNING: 'none' broadens CSRF exposure; use only in controlled staging environments.
const configuredSameSite = (): 'strict' | 'lax' | 'none' => {
  const val = process.env.COOKIE_SAME_SITE;
  if (val === 'lax' || val === 'none') return val;
  return 'strict';
};

const PATIENT_COOKIE_OPTIONS = (isProd: boolean) => ({
  httpOnly: true,
  secure: isProd || configuredSameSite() === 'none',
  sameSite: configuredSameSite(),
  path: '/patient-portal',
});

const PATIENT_CSRF_COOKIE_OPTIONS = (isProd: boolean) => ({
  httpOnly: true,
  secure: isProd || configuredSameSite() === 'none',
  sameSite: configuredSameSite(),
  path: '/patient-portal',
});

@Controller('api/v1/patient-portal')
@Public()
export class PatientPortalController {
  constructor(
    private readonly portalService: PatientPortalService,
    private readonly documentGenerator: DocumentGeneratorService,
  ) {}

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

    // Browser-safe response: no accessToken exposed to JS, include csrfToken for header
    return {
      patientId: result.patientId,
      email: result.email,
      csrfToken,
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

  @Get('lab-results/:id/pdf')
  @UseGuards(PatientJwtGuard)
  async downloadLabResultPdf(
    @GetPatientUser('tenantId') tenantId: string,
    @GetPatientUser('patientId') patientId: string,
    @GetPatientUser('userId') userId: string,
    @Param('id') resultId: string,
    @Res() res: Response,
  ) {
    const data = await this.portalService.getLabResultForExport(
      tenantId,
      patientId,
      userId,
      resultId,
    );
    const pdfBuffer = await this.documentGenerator.generateLabResultPdf(data);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="lab-result-${resultId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get('invoices/:id/pdf')
  @UseGuards(PatientJwtGuard)
  async downloadInvoicePdf(
    @GetPatientUser('tenantId') tenantId: string,
    @GetPatientUser('patientId') patientId: string,
    @GetPatientUser('userId') userId: string,
    @Param('id') invoiceId: string,
    @Res() res: Response,
  ) {
    const data = await this.portalService.getInvoiceForExport(
      tenantId,
      patientId,
      userId,
      invoiceId,
    );
    const pdfBuffer = await this.documentGenerator.generateInvoicePdf(data);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoiceId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get('prescriptions/:id/pdf')
  @UseGuards(PatientJwtGuard)
  async downloadPrescriptionPdf(
    @GetPatientUser('tenantId') tenantId: string,
    @GetPatientUser('patientId') patientId: string,
    @GetPatientUser('userId') userId: string,
    @Param('id') prescriptionId: string,
    @Res() res: Response,
  ) {
    const data = await this.portalService.getPrescriptionForExport(
      tenantId,
      patientId,
      userId,
      prescriptionId,
    );
    const pdfBuffer =
      await this.documentGenerator.generatePrescriptionPdf(data);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="prescription-${prescriptionId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get('payments/:id/receipt')
  @UseGuards(PatientJwtGuard)
  async downloadReceiptPdf(
    @GetPatientUser('tenantId') tenantId: string,
    @GetPatientUser('patientId') patientId: string,
    @GetPatientUser('userId') userId: string,
    @Param('id') paymentId: string,
    @Res() res: Response,
  ) {
    const data = await this.portalService.getPaymentForReceipt(
      tenantId,
      patientId,
      userId,
      paymentId,
    );
    const pdfBuffer = await this.documentGenerator.generateReceiptPdf(data);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${paymentId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Post('prescriptions/:id/refill-request')
  @UseGuards(PatientJwtGuard, PatientCsrfGuard)
  @HttpCode(HttpStatus.CREATED)
  async createRefillRequest(
    @GetPatientUser('tenantId') tenantId: string,
    @GetPatientUser('patientId') patientId: string,
    @GetPatientUser('userId') userId: string,
    @Param('id') prescriptionId: string,
    @Body() dto: CreateRefillRequestDto,
  ) {
    return this.portalService.createRefillRequest(
      tenantId,
      patientId,
      userId,
      prescriptionId,
      dto,
    );
  }

  @Get('refill-requests')
  @UseGuards(PatientJwtGuard)
  async getRefillRequests(
    @GetPatientUser('tenantId') tenantId: string,
    @GetPatientUser('patientId') patientId: string,
  ) {
    return this.portalService.getRefillRequests(tenantId, patientId);
  }

  @Post('medical-record-requests')
  @UseGuards(PatientJwtGuard, PatientCsrfGuard)
  @HttpCode(HttpStatus.CREATED)
  async createMedicalRecordRequest(
    @GetPatientUser('tenantId') tenantId: string,
    @GetPatientUser('patientId') patientId: string,
    @GetPatientUser('userId') userId: string,
    @Body() dto: CreateMedicalRecordRequestDto,
  ) {
    return this.portalService.createMedicalRecordRequest(
      tenantId,
      patientId,
      userId,
      dto,
    );
  }

  @Get('medical-record-requests')
  @UseGuards(PatientJwtGuard)
  async getMedicalRecordRequests(
    @GetPatientUser('tenantId') tenantId: string,
    @GetPatientUser('patientId') patientId: string,
  ) {
    return this.portalService.getMedicalRecordRequests(tenantId, patientId);
  }
}
