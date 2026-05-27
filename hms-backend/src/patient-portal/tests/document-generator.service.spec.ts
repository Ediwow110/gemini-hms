import { Test, TestingModule } from '@nestjs/testing';
import { DocumentGeneratorService } from '../services/document-generator.service';

// Mock PDFKit since it may not be installed yet.
// { virtual: true } allows Jest to create the mock even when the module
// cannot be resolved from node_modules.
jest.mock(
  'pdfkit',
  () => {
    const { EventEmitter } = require('events');

    const MockPDFDocument = jest.fn().mockImplementation(() => {
      const emitter = new EventEmitter();
      const instance = Object.assign(emitter, {
        fontSize: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        moveDown: jest.fn().mockReturnThis(),
        end: jest.fn().mockImplementation(function (this: any) {
          // Emit a minimal valid PDF buffer
          const pdfHeader = Buffer.from('%PDF-1.4 mock content');
          process.nextTick(() => {
            this.emit('data', pdfHeader);
            this.emit('end');
          });
        }),
      });
      return instance;
    });

    // Support both `import * as PDFDocument` and `import PDFDocument` patterns
    MockPDFDocument.default = MockPDFDocument;
    MockPDFDocument.__esModule = true;
    return MockPDFDocument;
  },
  { virtual: true },
);

describe('DocumentGeneratorService', () => {
  let service: DocumentGeneratorService;

  const mockPatient = {
    id: 'patient-1',
    firstName: 'John',
    lastName: 'Doe',
    patientNumber: 'PT-001',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentGeneratorService],
    }).compile();

    service = module.get<DocumentGeneratorService>(DocumentGeneratorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateLabResultPdf', () => {
    it('should return a Buffer', async () => {
      const result = await service.generateLabResultPdf({
        labResult: {
          id: 'result-1',
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
          remarks: 'Normal results',
          releasedAt: new Date(),
        },
        patient: mockPatient,
        tenantName: 'Test Hospital',
      });

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should start with PDF header (%PDF)', async () => {
      const result = await service.generateLabResultPdf({
        labResult: {
          id: 'result-1',
          status: 'RELEASED',
          results: null,
          remarks: null,
          releasedAt: null,
        },
        patient: mockPatient,
        tenantName: 'Test Hospital',
      });

      expect(result.toString('ascii', 0, 4)).toBe('%PDF');
    });
  });

  describe('generateInvoicePdf', () => {
    it('should return a Buffer', async () => {
      const result = await service.generateInvoicePdf({
        invoice: {
          id: 'inv-1',
          invoiceNumber: 'INV-001',
          totalAmount: 1000,
          paidAmount: 500,
          status: 'PARTIAL',
        },
        patient: mockPatient,
        tenantName: 'Test Hospital',
        payments: [
          {
            receiptNumber: 'REC-001',
            amount: 500,
            paymentMethod: 'CASH',
            status: 'POSTED',
            createdAt: new Date(),
          },
        ],
      });

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should start with PDF header (%PDF)', async () => {
      const result = await service.generateInvoicePdf({
        invoice: {
          id: 'inv-1',
          invoiceNumber: null,
          totalAmount: 0,
          paidAmount: 0,
          status: 'UNPAID',
        },
        patient: mockPatient,
        tenantName: 'Test Hospital',
        payments: [],
      });

      expect(result.toString('ascii', 0, 4)).toBe('%PDF');
    });
  });

  describe('generatePrescriptionPdf', () => {
    it('should return a Buffer', async () => {
      const result = await service.generatePrescriptionPdf({
        prescription: {
          id: 'rx-1',
          medicationName: 'Amoxicillin 500mg',
          dosage: '500mg',
          frequency: 'TID',
          duration: '7 days',
          notes: 'Take with food',
          prescribedBy: { id: 'doc-1', email: 'doctor@example.com' },
        },
        patient: mockPatient,
        tenantName: 'Test Hospital',
      });

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should start with PDF header (%PDF)', async () => {
      const result = await service.generatePrescriptionPdf({
        prescription: {
          id: 'rx-1',
          medicationName: 'Ibuprofen 200mg',
          dosage: '200mg',
          frequency: 'BID',
          duration: '5 days',
          notes: null,
          prescribedBy: null,
        },
        patient: mockPatient,
        tenantName: 'Test Hospital',
      });

      expect(result.toString('ascii', 0, 4)).toBe('%PDF');
    });
  });

  describe('generateReceiptPdf', () => {
    it('should return a Buffer', async () => {
      const result = await service.generateReceiptPdf({
        payment: {
          id: 'pay-1',
          receiptNumber: 'REC-001',
          amount: 500,
          paymentMethod: 'CASH',
          status: 'POSTED',
          createdAt: new Date(),
          invoice: { invoiceNumber: 'INV-001' },
        },
        patient: mockPatient,
        tenantName: 'Test Hospital',
      });

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should start with PDF header (%PDF)', async () => {
      const result = await service.generateReceiptPdf({
        payment: {
          id: 'pay-1',
          receiptNumber: null,
          amount: 0,
          paymentMethod: 'CASH',
          status: 'POSTED',
          createdAt: new Date(),
          invoice: null,
        },
        patient: mockPatient,
        tenantName: 'Test Hospital',
      });

      expect(result.toString('ascii', 0, 4)).toBe('%PDF');
    });
  });
});
