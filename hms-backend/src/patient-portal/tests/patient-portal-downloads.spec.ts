import { Test, TestingModule } from '@nestjs/testing';
import { PatientPortalService } from '../patient-portal.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../../audit/audit.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('PatientPortalService Downloads and Requests', () => {
  let service: PatientPortalService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      tenant: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ id: 'tenant-1', name: 'Test Tenant' }),
      },
      labResult: { findFirst: jest.fn() },
      invoice: { findFirst: jest.fn() },
      prescription: { findFirst: jest.fn() },
      payment: { findFirst: jest.fn() },
      refillRequest: { findFirst: jest.fn(), create: jest.fn() },
      medicalRecordRequest: { findFirst: jest.fn(), create: jest.fn() },
    };
    audit = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientPortalService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: {} },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<PatientPortalService>(PatientPortalService);
  });

  describe('getInvoices', () => {
    it('should include latestPostedPaymentId in invoice summary', async () => {
      prisma.invoice.findMany = jest.fn().mockResolvedValue([
        {
          id: 'inv-1',
          invoiceNumber: 'INV-001',
          status: 'PAID',
          totalAmount: 1000,
          paidAmount: 1000,
          createdAt: new Date(),
          payments: [{ id: 'pay-123' }],
        },
      ]);

      const res = await service.getInvoices('tenant-1', 'patient-1');
      expect(res[0].latestPostedPaymentId).toBe('pay-123');
    });
  });

  describe('Lab Results', () => {
    it('should allow patient to download own released lab result and log audit', async () => {
      const mockResult = {
        id: 'result-1',
        order: { patient: { id: 'patient-1' } },
      };
      prisma.labResult.findFirst.mockResolvedValue(mockResult);

      const res = await service.getLabResultForExport(
        'tenant-1',
        'patient-1',
        'result-1',
      );
      expect(res.labResult).toBe(mockResult);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'LAB_RESULT_PDF_EXPORTED',
        }),
      );
    });

    it('should block if lab result is unreleased or wrong patient', async () => {
      prisma.labResult.findFirst.mockResolvedValue(null);
      await expect(
        service.getLabResultForExport('tenant-1', 'patient-1', 'result-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Invoices', () => {
    it('should allow patient to download own posted invoice and log audit', async () => {
      const mockInvoice = {
        id: 'inv-1',
        order: { patient: { id: 'patient-1' } },
      };
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);

      const res = await service.getInvoiceForExport(
        'tenant-1',
        'patient-1',
        'inv-1',
      );
      expect(res.invoice).toBe(mockInvoice);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'INVOICE_PDF_EXPORTED',
        }),
      );
    });

    it('should block if invoice is wrong patient or missing', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);
      await expect(
        service.getInvoiceForExport('tenant-1', 'patient-1', 'inv-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Receipts', () => {
    it('should allow patient to download own paid receipt and log audit', async () => {
      const mockPayment = {
        id: 'pay-1',
        invoice: { order: { patient: { id: 'patient-1' } } },
      };
      prisma.payment.findFirst.mockResolvedValue(mockPayment);

      const res = await service.getPaymentForReceipt(
        'tenant-1',
        'patient-1',
        'pay-1',
      );
      expect(res.payment).toBe(mockPayment);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'PATIENT_RECEIPT_DOWNLOADED',
        }),
      );
    });

    it('should block if receipt is unpaid or wrong patient', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);
      await expect(
        service.getPaymentForReceipt('tenant-1', 'patient-1', 'pay-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Prescriptions', () => {
    it('should allow patient to download own valid prescription and log audit', async () => {
      const mockRx = { id: 'rx-1', patient: { id: 'patient-1' } };
      prisma.prescription.findFirst.mockResolvedValue(mockRx);

      const res = await service.getPrescriptionForExport(
        'tenant-1',
        'patient-1',
        'rx-1',
      );
      expect(res.prescription).toBe(mockRx);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'PRESCRIPTION_PDF_EXPORTED',
        }),
      );
    });

    it('should block if prescription is draft/cancelled or wrong patient', async () => {
      prisma.prescription.findFirst.mockResolvedValue(null);
      await expect(
        service.getPrescriptionForExport('tenant-1', 'patient-1', 'rx-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Refill Requests', () => {
    it('should validate ownership and create trackable request, logging audit', async () => {
      const mockRx = { id: 'rx-1' };
      prisma.prescription.findFirst.mockResolvedValue(mockRx);
      prisma.refillRequest.findFirst.mockResolvedValue(null); // No existing pending request
      prisma.refillRequest.create.mockResolvedValue({ id: 'refill-1' });

      await service.createRefillRequest('tenant-1', 'patient-1', 'rx-1', {
        reason: 'need more',
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'PRESCRIPTION_REFILL_REQUESTED',
        }),
      );
    });

    it('should block duplicate open requests', async () => {
      const mockRx = { id: 'rx-1' };
      prisma.prescription.findFirst.mockResolvedValue(mockRx);
      prisma.refillRequest.findFirst.mockResolvedValue({ id: 'refill-old' });

      await expect(
        service.createRefillRequest('tenant-1', 'patient-1', 'rx-1', {
          reason: 'need more',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Medical Record Requests', () => {
    it('should create medical record request and log audit', async () => {
      prisma.medicalRecordRequest.findFirst.mockResolvedValue(null);
      prisma.medicalRecordRequest.create.mockResolvedValue({ id: 'mr-1' });

      await service.createMedicalRecordRequest('tenant-1', 'patient-1', {
        requestType: 'FULL_RECORD',
        reason: 'moving',
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'MEDICAL_RECORD_COPY_REQUESTED',
        }),
      );
    });

    it('should block duplicate requests', async () => {
      prisma.medicalRecordRequest.findFirst.mockResolvedValue({ id: 'mr-old' });

      await expect(
        service.createMedicalRecordRequest('tenant-1', 'patient-1', {
          requestType: 'FULL_RECORD',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
