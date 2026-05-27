import { Test, TestingModule } from '@nestjs/testing';
import { PatientPortalService } from '../patient-portal.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('PatientPortalService - Exports & Self-Service', () => {
  let service: PatientPortalService;
  let prisma: any;
  let audit: any;

  const mockTenantId = 'tenant-1';
  const mockPatientId = 'patient-1';
  const mockUserId = 'user-1';
  const mockResultId = 'result-1';
  const mockInvoiceId = 'invoice-1';
  const mockPrescriptionId = 'rx-1';

  const mockTenant = { id: mockTenantId, name: 'Test Hospital' };

  const mockPatient = {
    id: mockPatientId,
    firstName: 'John',
    lastName: 'Doe',
    patientNumber: 'PT-001',
  };

  const mockLabResult = {
    id: mockResultId,
    status: 'RELEASED',
    results: JSON.stringify([
      {
        parameter: 'Hemoglobin',
        value: '14.5',
        unit: 'g/dL',
        referenceRange: '12-16',
        flag: 'N',
      },
    ]),
    remarks: 'Normal',
    releasedAt: new Date(),
    order: {
      tenantId: mockTenantId,
      patientId: mockPatientId,
      patient: mockPatient,
    },
  };

  const mockInvoice = {
    id: mockInvoiceId,
    invoiceNumber: 'INV-001',
    totalAmount: 1000,
    paidAmount: 500,
    status: 'PARTIAL',
    payments: [
      {
        receiptNumber: 'REC-001',
        amount: 500,
        paymentMethod: 'CASH',
        status: 'POSTED',
        createdAt: new Date(),
      },
    ],
    order: {
      tenantId: mockTenantId,
      patientId: mockPatientId,
      patient: mockPatient,
    },
  };

  const mockPrescription = {
    id: mockPrescriptionId,
    tenantId: mockTenantId,
    patientId: mockPatientId,
    medicationName: 'Amoxicillin 500mg',
    dosage: '500mg',
    frequency: 'TID',
    duration: '7 days',
    notes: 'Take with food',
    status: 'ACTIVE',
    prescribedBy: { id: 'doc-1', email: 'doctor@example.com' },
    patient: mockPatient,
  };

  const mockRefillRequest = {
    id: 'refill-1',
    tenantId: mockTenantId,
    patientId: mockPatientId,
    prescriptionId: mockPrescriptionId,
    status: 'PENDING',
    reason: 'Running low',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMedRecordRequest = {
    id: 'medrec-1',
    tenantId: mockTenantId,
    patientId: mockPatientId,
    requestType: 'FULL_RECORD',
    status: 'PENDING',
    reason: 'Insurance',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      labResult: {
        findFirst: jest.fn(),
      },
      invoice: {
        findFirst: jest.fn(),
      },
      prescription: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      patient: {
        findFirst: jest.fn(),
      },
      tenant: {
        findFirst: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      patientUser: {
        findFirst: jest.fn(),
      },
      refillRequest: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      medicalRecordRequest: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    audit = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientPortalService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
      ],
    }).compile();

    service = module.get<PatientPortalService>(PatientPortalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────
  // getLabResultForExport
  // ──────────────────────────────────────────────

  describe('getLabResultForExport', () => {
    it('should return data for a RELEASED lab result', async () => {
      prisma.labResult.findFirst.mockResolvedValue(mockLabResult);
      prisma.tenant.findUniqueOrThrow.mockResolvedValue(mockTenant);

      const result = await service.getLabResultForExport(
        mockTenantId,
        mockPatientId,
        mockUserId,
        mockResultId,
      );

      expect(result.labResult).toBe(mockLabResult);
      expect(result.patient).toBe(mockPatient);
      expect(result.tenantName).toBe('Test Hospital');
      expect(prisma.labResult.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: mockResultId,
            status: 'RELEASED',
            order: { tenantId: mockTenantId, patientId: mockPatientId },
          }),
        }),
      );
    });

    it('should throw NotFoundException for non-released lab result', async () => {
      prisma.labResult.findFirst.mockResolvedValue(null);

      await expect(
        service.getLabResultForExport(
          mockTenantId,
          mockPatientId,
          mockUserId,
          mockResultId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should enforce tenant + patient scope', async () => {
      prisma.labResult.findFirst.mockResolvedValue(null);

      await expect(
        service.getLabResultForExport(
          'wrong-tenant',
          'wrong-patient',
          mockUserId,
          mockResultId,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.labResult.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            order: { tenantId: 'wrong-tenant', patientId: 'wrong-patient' },
          }),
        }),
      );
    });

    it('should log audit event on export', async () => {
      prisma.labResult.findFirst.mockResolvedValue(mockLabResult);
      prisma.tenant.findUniqueOrThrow.mockResolvedValue(mockTenant);

      await service.getLabResultForExport(
        mockTenantId,
        mockPatientId,
        mockUserId,
        mockResultId,
      );

      expect(audit.log).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        userId: mockUserId,
        eventKey: 'LAB_RESULT_PDF_EXPORTED',
        recordType: 'LabResult',
        recordId: mockResultId,
      });
    });
  });

  // ──────────────────────────────────────────────
  // getInvoiceForExport
  // ──────────────────────────────────────────────

  describe('getInvoiceForExport', () => {
    it('should return data with payments', async () => {
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      prisma.tenant.findUniqueOrThrow.mockResolvedValue(mockTenant);

      const result = await service.getInvoiceForExport(
        mockTenantId,
        mockPatientId,
        mockUserId,
        mockInvoiceId,
      );

      expect(result.invoice).toBe(mockInvoice);
      expect(result.patient).toBe(mockPatient);
      expect(result.payments).toBe(mockInvoice.payments);
      expect(result.tenantName).toBe('Test Hospital');
    });

    it('should throw NotFoundException for wrong scope', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);

      await expect(
        service.getInvoiceForExport(
          'wrong-tenant',
          'wrong-patient',
          mockUserId,
          mockInvoiceId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log audit event on export', async () => {
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      prisma.tenant.findUniqueOrThrow.mockResolvedValue(mockTenant);

      await service.getInvoiceForExport(
        mockTenantId,
        mockPatientId,
        mockUserId,
        mockInvoiceId,
      );

      expect(audit.log).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        userId: mockUserId,
        eventKey: 'INVOICE_PDF_EXPORTED',
        recordType: 'Invoice',
        recordId: mockInvoiceId,
      });
    });
  });

  // ──────────────────────────────────────────────
  // getPrescriptionForExport
  // ──────────────────────────────────────────────

  describe('getPrescriptionForExport', () => {
    it('should return data for ACTIVE prescription', async () => {
      prisma.prescription.findFirst.mockResolvedValue(mockPrescription);
      prisma.tenant.findUniqueOrThrow.mockResolvedValue(mockTenant);

      const result = await service.getPrescriptionForExport(
        mockTenantId,
        mockPatientId,
        mockUserId,
        mockPrescriptionId,
      );

      expect(result.prescription).toBe(mockPrescription);
      expect(result.patient).toBe(mockPatient);
      expect(result.tenantName).toBe('Test Hospital');
    });

    it('should return data for DISPENSED prescription', async () => {
      const dispensedRx = { ...mockPrescription, status: 'DISPENSED' };
      prisma.prescription.findFirst.mockResolvedValue(dispensedRx);
      prisma.tenant.findUniqueOrThrow.mockResolvedValue(mockTenant);

      const result = await service.getPrescriptionForExport(
        mockTenantId,
        mockPatientId,
        mockUserId,
        mockPrescriptionId,
      );

      expect(result.prescription.status).toBe('DISPENSED');
    });

    it('should throw NotFoundException for CANCELLED prescription', async () => {
      prisma.prescription.findFirst.mockResolvedValue(null);

      await expect(
        service.getPrescriptionForExport(
          mockTenantId,
          mockPatientId,
          mockUserId,
          mockPrescriptionId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log audit event on export', async () => {
      prisma.prescription.findFirst.mockResolvedValue(mockPrescription);
      prisma.tenant.findUniqueOrThrow.mockResolvedValue(mockTenant);

      await service.getPrescriptionForExport(
        mockTenantId,
        mockPatientId,
        mockUserId,
        mockPrescriptionId,
      );

      expect(audit.log).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        userId: mockUserId,
        eventKey: 'PRESCRIPTION_PDF_EXPORTED',
        recordType: 'Prescription',
        recordId: mockPrescriptionId,
      });
    });
  });

  // ──────────────────────────────────────────────
  // getPaymentForReceipt
  // ──────────────────────────────────────────────

  describe('getPaymentForReceipt', () => {
    const mockPayment = {
      id: 'pay-1',
      receiptNumber: 'REC-001',
      amount: 500,
      paymentMethod: 'CASH',
      status: 'POSTED',
      createdAt: new Date(),
      invoice: {
        invoiceNumber: 'INV-001',
        order: {
          patient: mockPatient,
        },
      },
    };

    it('should return data for POSTED payment', async () => {
      prisma.payment = prisma.payment || { findFirst: jest.fn() };
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.tenant.findUniqueOrThrow.mockResolvedValue(mockTenant);

      const result = await service.getPaymentForReceipt(
        mockTenantId,
        mockPatientId,
        mockUserId,
        'pay-1',
      );

      expect(result.payment).toBe(mockPayment);
      expect(result.patient).toBe(mockPatient);
      expect(result.tenantName).toBe('Test Hospital');
    });

    it('should throw NotFoundException for non-POSTED payment', async () => {
      prisma.payment = prisma.payment || { findFirst: jest.fn() };
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.getPaymentForReceipt(mockTenantId, mockPatientId, mockUserId, 'pay-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log audit event on receipt download', async () => {
      prisma.payment = prisma.payment || { findFirst: jest.fn() };
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.tenant.findUniqueOrThrow.mockResolvedValue(mockTenant);

      await service.getPaymentForReceipt(mockTenantId, mockPatientId, mockUserId, 'pay-1');

      expect(audit.log).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        userId: mockUserId,
        eventKey: 'PATIENT_RECEIPT_DOWNLOADED',
        recordType: 'Payment',
        recordId: 'pay-1',
      });
    });
  });

  // ──────────────────────────────────────────────
  // createRefillRequest
  // ──────────────────────────────────────────────

  describe('createRefillRequest', () => {
    it('should create a refill request for an ACTIVE prescription', async () => {
      prisma.prescription.findFirst.mockResolvedValue(mockPrescription);
      prisma.refillRequest.findFirst.mockResolvedValue(null);
      prisma.refillRequest.create.mockResolvedValue(mockRefillRequest);

      const result = await service.createRefillRequest(
        mockTenantId,
        mockPatientId,
        mockUserId,
        mockPrescriptionId,
        { reason: 'Running low' },
      );

      expect(result).toBe(mockRefillRequest);
      expect(prisma.refillRequest.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          patientId: mockPatientId,
          prescriptionId: mockPrescriptionId,
          reason: 'Running low',
        },
      });
    });

    it('should throw ConflictException for duplicate pending request', async () => {
      prisma.prescription.findFirst.mockResolvedValue(mockPrescription);
      prisma.refillRequest.findFirst.mockResolvedValue(mockRefillRequest);

      await expect(
        service.createRefillRequest(
          mockTenantId,
          mockPatientId,
          mockUserId,
          mockPrescriptionId,
          { reason: 'Running low' },
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for wrong scope', async () => {
      prisma.prescription.findFirst.mockResolvedValue(null);

      await expect(
        service.createRefillRequest(
          'wrong-tenant',
          'wrong-patient',
          mockUserId,
          mockPrescriptionId,
          {},
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-ACTIVE prescription', async () => {
      prisma.prescription.findFirst.mockResolvedValue(null);

      await expect(
        service.createRefillRequest(
          mockTenantId,
          mockPatientId,
          mockUserId,
          mockPrescriptionId,
          {},
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log audit event on creation', async () => {
      prisma.prescription.findFirst.mockResolvedValue(mockPrescription);
      prisma.refillRequest.findFirst.mockResolvedValue(null);
      prisma.refillRequest.create.mockResolvedValue(mockRefillRequest);

      await service.createRefillRequest(
        mockTenantId,
        mockPatientId,
        mockUserId,
        mockPrescriptionId,
        { reason: 'Running low' },
      );

      expect(audit.log).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        userId: mockUserId,
        eventKey: 'PRESCRIPTION_REFILL_REQUESTED',
        recordType: 'RefillRequest',
        recordId: mockRefillRequest.id,
        newValues: {
          prescriptionId: mockPrescriptionId,
          reason: 'Running low',
        },
      });
    });
  });

  // ──────────────────────────────────────────────
  // getRefillRequests
  // ──────────────────────────────────────────────

  describe('getRefillRequests', () => {
    it('should return only own requests', async () => {
      const ownRequests = [
        {
          id: 'refill-1',
          prescriptionId: mockPrescriptionId,
          status: 'PENDING',
          reason: 'Running low',
          reviewNotes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      prisma.refillRequest.findMany.mockResolvedValue(ownRequests);

      const result = await service.getRefillRequests(
        mockTenantId,
        mockPatientId,
      );

      expect(result).toBe(ownRequests);
      expect(prisma.refillRequest.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, patientId: mockPatientId },
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
    });
  });

  // ──────────────────────────────────────────────
  // createMedicalRecordRequest
  // ──────────────────────────────────────────────

  describe('createMedicalRecordRequest', () => {
    it('should create a medical record request', async () => {
      prisma.medicalRecordRequest.findFirst.mockResolvedValue(null);
      prisma.medicalRecordRequest.create.mockResolvedValue(
        mockMedRecordRequest,
      );

      const result = await service.createMedicalRecordRequest(
        mockTenantId,
        mockPatientId,
        mockUserId,
        { requestType: 'FULL_RECORD', reason: 'Insurance' },
      );

      expect(result).toBe(mockMedRecordRequest);
      expect(prisma.medicalRecordRequest.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          patientId: mockPatientId,
          requestType: 'FULL_RECORD',
          reason: 'Insurance',
        },
      });
    });

    it('should default requestType to FULL_RECORD when not provided', async () => {
      prisma.medicalRecordRequest.findFirst.mockResolvedValue(null);
      prisma.medicalRecordRequest.create.mockResolvedValue(
        mockMedRecordRequest,
      );

      await service.createMedicalRecordRequest(mockTenantId, mockPatientId, mockUserId, {});

      expect(prisma.medicalRecordRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          requestType: 'FULL_RECORD',
        }),
      });
    });

    it('should throw ConflictException for duplicate pending request', async () => {
      prisma.medicalRecordRequest.findFirst.mockResolvedValue(
        mockMedRecordRequest,
      );

      await expect(
        service.createMedicalRecordRequest(mockTenantId, mockPatientId, mockUserId, {}),
      ).rejects.toThrow(ConflictException);
    });

    it('should log audit event on creation', async () => {
      prisma.medicalRecordRequest.findFirst.mockResolvedValue(null);
      prisma.medicalRecordRequest.create.mockResolvedValue(
        mockMedRecordRequest,
      );

      await service.createMedicalRecordRequest(mockTenantId, mockPatientId, mockUserId, {
        requestType: 'LAB_RESULTS_ONLY',
        reason: 'Insurance',
      });

      expect(audit.log).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        userId: mockUserId,
        eventKey: 'MEDICAL_RECORD_COPY_REQUESTED',
        recordType: 'MedicalRecordRequest',
        recordId: mockMedRecordRequest.id,
        newValues: {
          requestType: 'LAB_RESULTS_ONLY',
          reason: 'Insurance',
        },
      });
    });
  });

  // ──────────────────────────────────────────────
  // getMedicalRecordRequests
  // ──────────────────────────────────────────────

  describe('getMedicalRecordRequests', () => {
    it('should return only own requests', async () => {
      const ownRequests = [
        {
          id: 'medrec-1',
          requestType: 'FULL_RECORD',
          status: 'PENDING',
          reason: 'Insurance',
          reviewNotes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      prisma.medicalRecordRequest.findMany.mockResolvedValue(ownRequests);

      const result = await service.getMedicalRecordRequests(
        mockTenantId,
        mockPatientId,
      );

      expect(result).toBe(ownRequests);
      expect(prisma.medicalRecordRequest.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, patientId: mockPatientId },
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
    });
  });
});
