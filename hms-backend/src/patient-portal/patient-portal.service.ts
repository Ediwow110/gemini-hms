import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../audit/audit.service';
import { PatientLoginDto } from './dto/patient-portal-auth.dto';
import { CreateRefillRequestDto } from './dto/refill-request.dto';
import { CreateMedicalRecordRequestDto } from './dto/medical-record-request.dto';
import * as bcrypt from 'bcrypt';
import { PrescriptionStatus } from '@prisma/client';

@Injectable()
export class PatientPortalService {
  private readonly logger = new Logger(PatientPortalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
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
        payments: {
          where: { status: 'POSTED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true },
        },
      },
    });

    return invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      balance: Number(inv.totalAmount) - Number(inv.paidAmount),
      latestPostedPaymentId: inv.payments[0]?.id || null,
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

  // ──────────────────────────────────────────────
  // PDF Export methods — all enforce tenantId + patientId scope
  // ──────────────────────────────────────────────

  async getLabResultForExport(
    tenantId: string,
    patientId: string,
    resultId: string,
  ) {
    const labResult = await this.prisma.labResult.findFirst({
      where: {
        id: resultId,
        order: { tenantId, patientId },
        status: 'RELEASED',
      },
      include: {
        order: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                patientNumber: true,
              },
            },
          },
        },
      },
    });
    if (!labResult)
      throw new NotFoundException('Lab result not found or not yet released');

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    await this.auditService.log({
      tenantId,
      userId: patientId,
      eventKey: 'LAB_RESULT_PDF_EXPORTED',
      recordType: 'LabResult',
      recordId: resultId,
    });

    return {
      labResult,
      patient: labResult.order.patient,
      tenantName: tenant.name,
    };
  }

  async getInvoiceForExport(
    tenantId: string,
    patientId: string,
    invoiceId: string,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        order: { tenantId, patientId },
      },
      include: {
        payments: true,
        order: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                patientNumber: true,
              },
            },
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    await this.auditService.log({
      tenantId,
      userId: patientId,
      eventKey: 'INVOICE_PDF_EXPORTED',
      recordType: 'Invoice',
      recordId: invoiceId,
    });

    return {
      invoice,
      patient: invoice.order.patient,
      tenantName: tenant.name,
      payments: invoice.payments,
    };
  }

  async getPrescriptionForExport(
    tenantId: string,
    patientId: string,
    prescriptionId: string,
  ) {
    const prescription = await this.prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        tenantId,
        patientId,
        status: { in: ['ACTIVE', 'DISPENSED'] },
      },
      include: {
        prescribedBy: { select: { id: true, email: true } },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientNumber: true,
          },
        },
      },
    });
    if (!prescription) throw new NotFoundException('Prescription not found');

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    await this.auditService.log({
      tenantId,
      userId: patientId,
      eventKey: 'PRESCRIPTION_PDF_EXPORTED',
      recordType: 'Prescription',
      recordId: prescriptionId,
    });

    return {
      prescription,
      patient: prescription.patient,
      tenantName: tenant.name,
    };
  }

  async getPaymentForReceipt(
    tenantId: string,
    patientId: string,
    paymentId: string,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        tenantId,
        invoice: { order: { patientId } },
        status: 'POSTED',
      },
      include: {
        invoice: {
          include: {
            order: {
              include: {
                patient: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    patientNumber: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!payment)
      throw new NotFoundException('Payment not found or not yet posted');

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    await this.auditService.log({
      tenantId,
      userId: patientId,
      eventKey: 'PATIENT_RECEIPT_DOWNLOADED',
      recordType: 'Payment',
      recordId: paymentId,
    });

    return {
      payment,
      patient: payment.invoice.order.patient,
      tenantName: tenant.name,
    };
  }

  // ──────────────────────────────────────────────
  // Self-service request methods
  // ──────────────────────────────────────────────

  async createRefillRequest(
    tenantId: string,
    patientId: string,
    prescriptionId: string,
    dto: CreateRefillRequestDto,
  ) {
    // Verify prescription exists, belongs to this patient, and is ACTIVE
    const prescription = await this.prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        tenantId,
        patientId,
        status: 'ACTIVE',
      },
    });
    if (!prescription)
      throw new NotFoundException(
        'Prescription not found or not eligible for refill',
      );

    // Check for existing pending request
    const existingRequest = await this.prisma.refillRequest.findFirst({
      where: {
        tenantId,
        patientId,
        prescriptionId,
        status: 'PENDING',
      },
    });
    if (existingRequest)
      throw new ConflictException(
        'A refill request for this prescription is already pending',
      );

    const refillRequest = await this.prisma.refillRequest.create({
      data: {
        tenantId,
        patientId,
        prescriptionId,
        reason: dto.reason,
      },
    });

    await this.auditService.log({
      tenantId,
      userId: patientId,
      eventKey: 'PRESCRIPTION_REFILL_REQUESTED',
      recordType: 'RefillRequest',
      recordId: refillRequest.id,
      newValues: { prescriptionId, reason: dto.reason },
    });

    return refillRequest;
  }

  async getRefillRequests(tenantId: string, patientId: string) {
    return this.prisma.refillRequest.findMany({
      where: { tenantId, patientId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        prescriptionId: true,
        status: true,
        reason: true,
        reviewNotes: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createMedicalRecordRequest(
    tenantId: string,
    patientId: string,
    dto: CreateMedicalRecordRequestDto,
  ) {
    // Check for existing pending request
    const existingRequest = await this.prisma.medicalRecordRequest.findFirst({
      where: {
        tenantId,
        patientId,
        status: 'PENDING',
      },
    });
    if (existingRequest)
      throw new ConflictException(
        'A medical record request is already pending',
      );

    const recordRequest = await this.prisma.medicalRecordRequest.create({
      data: {
        tenantId,
        patientId,
        requestType: dto.requestType || 'FULL_RECORD',
        reason: dto.reason,
      },
    });

    await this.auditService.log({
      tenantId,
      userId: patientId,
      eventKey: 'MEDICAL_RECORD_COPY_REQUESTED',
      recordType: 'MedicalRecordRequest',
      recordId: recordRequest.id,
      newValues: {
        requestType: dto.requestType || 'FULL_RECORD',
        reason: dto.reason,
      },
    });

    return recordRequest;
  }

  async getMedicalRecordRequests(tenantId: string, patientId: string) {
    return this.prisma.medicalRecordRequest.findMany({
      where: { tenantId, patientId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        requestType: true,
        status: true,
        reason: true,
        reviewNotes: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
