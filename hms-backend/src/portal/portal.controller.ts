import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { PortalAuthGuard } from './portal-auth.guard';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Post('auth/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.portalService.requestOtp(dto);
  }

  @Post('auth/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.portalService.verifyOtp(dto);
  }

  @UseGuards(PortalAuthGuard)
  @Get('results')
  async getResults(@Request() req: AuthenticatedRequest) {
    return this.portalService.getResults(
      req.user.tenantId,
      req.user.patientId!,
    );
  }

  @UseGuards(PortalAuthGuard)
  @Get('invoices')
  async getInvoices(@Request() req: AuthenticatedRequest) {
    return this.portalService.getInvoices(
      req.user.tenantId,
      req.user.patientId!,
    );
  }
}
