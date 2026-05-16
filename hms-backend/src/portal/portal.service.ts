import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PortalService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async requestOtp(data: {
    tenantId: string;
    branchId: string;
    patientNumber: string;
    email?: string;
    phone?: string;
  }) {
    const patient = await this.prisma.patient.findUnique({
      where: {
        tenantId_patientNumber: {
          tenantId: data.tenantId,
          patientNumber: data.patientNumber,
        },
      },
    });

    if (!patient) {
      // In a real production system, we might return success to avoid user enumeration
      // but for this implementation, we follow standard flow.
      throw new NotFoundException('Patient not found');
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.portalOtp.create({
      data: {
        tenantId: data.tenantId,
        branchId: data.branchId,
        patientId: patient.id,
        otpCode: hashedOtp,
        expiresAt,
      },
    });

    // Send OTP via notification service (Strictly PHI-safe)
    await this.notificationsService.sendExternalNotification({
      tenantId: data.tenantId,
      branchId: data.branchId,
      patientId: patient.id,
      channel: 'EMAIL',
      recipient: data.email || 'patient@example.com',
      templateName: 'PORTAL_OTP',
      templateData: {
        patientName: patient.firstName,
        secureLink: `OTP: ${otp}`, // The OTP itself is the secure credential
      },
    });

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(data: {
    tenantId: string;
    patientNumber: string;
    otpCode: string;
  }) {
    const patient = await this.prisma.patient.findUnique({
      where: {
        tenantId_patientNumber: {
          tenantId: data.tenantId,
          patientNumber: data.patientNumber,
        },
      },
    });

    if (!patient) throw new UnauthorizedException('Invalid credentials');

    const otpRecord = await this.prisma.portalOtp.findFirst({
      where: {
        patientId: patient.id,
        tenantId: data.tenantId,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) throw new UnauthorizedException('Invalid or expired OTP');

    const isValid = await bcrypt.compare(data.otpCode, otpRecord.otpCode);
    if (!isValid) throw new UnauthorizedException('Invalid OTP');

    await this.prisma.portalOtp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    const payload = {
      sub: patient.id,
      patientId: patient.id,
      tenantId: data.tenantId,
      roles: ['PATIENT'],
    };

    return {
      accessToken: this.jwtService.sign(payload),
      patient: {
        id: patient.id,
        patientNumber: patient.patientNumber,
        firstName: patient.firstName,
        lastName: patient.lastName,
      },
    };
  }

  async getResults(tenantId: string, patientId: string) {
    // Data Exposure Boundary: ONLY return RELEASED lab results.
    // ENCODED or APPROVED must be hidden.
    return this.prisma.labResult.findMany({
      where: {
        tenantId,
        order: { patientId },
        status: 'RELEASED',
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async getInvoices(tenantId: string, patientId: string) {
    // Tenant & Identity Scope: Filter by BOTH tenantId AND patientId.
    return this.prisma.invoice.findMany({
      where: {
        tenantId,
        order: { patientId },
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            createdAt: true,
          },
        },
      },
    });
  }
}
