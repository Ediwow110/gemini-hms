import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { PatientLoginDto } from './dto/patient-portal-auth.dto';
import * as bcrypt from 'bcrypt';
import { PrescriptionStatus } from '@prisma/client';

@Injectable()
export class PatientPortalService {
  private readonly logger = new Logger(PatientPortalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: PatientLoginDto) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { name: dto.tenantCode },
    });

    if (!tenant) {
      throw new UnauthorizedException('Invalid tenant or credentials');
    }

    const patientUser = await this.prisma.patientUser.findFirst({
      where: { tenantId: tenant.id, email: dto.email, status: 'ACTIVE' },
    });

    if (!patientUser) {
      throw new UnauthorizedException('Invalid tenant or credentials');
    }

    const passwordMatch = await bcrypt.compare(
      dto.password,
      patientUser.passwordHash,
    );
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid tenant or credentials');
    }

    const payload = {
      sub: patientUser.id,
      tenantId: patientUser.tenantId,
      patientId: patientUser.patientId,
      email: patientUser.email,
      isPatientPortal: true,
    };

    const token = await this.jwtService.signAsync(payload);

    // Return token + safe patient info; controller decides whether to expose token in body
    return {
      accessToken: token,
      patientId: patientUser.patientId,
      email: patientUser.email,
    };
  }

  async getProfile(tenantId: string, patientId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
      select: {
        id: true,
        patientNumber: true,
        firstName: true,
        lastName: true,
        dob: true,
        status: true,
        createdAt: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    return patient;
  }

  async getReleasedLabResults(tenantId: string, patientId: string) {
    // Only return lab results that have been APPROVED or RELEASED.
    // In our audit, "released/authorized content" for lab results means status === 'RELEASED'.
    return this.prisma.labResult.findMany({
      where: {
        order: {
          tenantId,
          patientId,
        },
        status: 'RELEASED',
      },
      select: {
        id: true,
        status: true,
        results: true,
        remarks: true,
        lockedAt: true,
        createdAt: true,
      },
    });
  }

  async getInvoices(tenantId: string, patientId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        order: {
          tenantId,
          patientId,
        },
      },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalAmount: true,
        paidAmount: true,
        createdAt: true,
      },
    });

    return invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      balance: Number(inv.totalAmount) - Number(inv.paidAmount),
      createdAt: inv.createdAt,
    }));
  }

  async getPrescriptions(tenantId: string, patientId: string) {
    // Only return ACTIVE or DISPENSED prescriptions (do not show CANCELLED).
    return this.prisma.prescription.findMany({
      where: {
        tenantId,
        patientId,
        status: {
          in: [PrescriptionStatus.ACTIVE, PrescriptionStatus.DISPENSED],
        },
      },
      select: {
        id: true,
        medicationName: true,
        dosage: true,
        frequency: true,
        duration: true,
        notes: true,
        status: true,
        createdAt: true,
      },
    });
  }
}
