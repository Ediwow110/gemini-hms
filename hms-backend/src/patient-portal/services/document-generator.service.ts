import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class DocumentGeneratorService {
  /**
   * Generate a PDF report for a released lab result.
   */
  async generateLabResultPdf(data: {
    labResult: any;
    patient: any;
    tenantName: string;
  }): Promise<Buffer> {
    const { labResult, patient, tenantName } = data;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(18).text(tenantName, { align: 'center' });
      doc.fontSize(14).text('Laboratory Result Report', { align: 'center' });
      doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString()}`, {
        align: 'center',
      });
      doc.moveDown();

      // Patient info
      doc.fontSize(12).text('Patient Information', { underline: true });
      doc
        .fontSize(10)
        .text(
          `Name: ${patient.firstName} ${patient.lastName}`,
        );
      doc.text(`Patient Number: ${patient.patientNumber}`);
      doc.moveDown();

      // Results table
      doc.fontSize(12).text('Results', { underline: true });
      doc.moveDown(0.5);

      let results: any[] = [];
      try {
        results =
          typeof labResult.results === 'string'
            ? JSON.parse(labResult.results)
            : labResult.results || [];
      } catch {
        results = [];
      }

      if (Array.isArray(results) && results.length > 0) {
        // Table header
        doc
          .fontSize(9)
          .text(
            this.padColumns([
              'Parameter',
              'Value',
              'Unit',
              'Reference Range',
              'Flag',
            ]),
          );
        doc.text(
          '─'.repeat(80),
        );

        for (const row of results) {
          doc.text(
            this.padColumns([
              row.parameter || row.name || '-',
              row.value != null ? String(row.value) : '-',
              row.unit || '-',
              row.referenceRange || row.reference || '-',
              row.flag || '-',
            ]),
          );
        }
      } else {
        doc.fontSize(10).text('No result data available.');
      }

      doc.moveDown();

      // Remarks
      if (labResult.remarks) {
        doc.fontSize(12).text('Remarks', { underline: true });
        doc.fontSize(10).text(labResult.remarks);
        doc.moveDown();
      }

      // Released date
      if (labResult.releasedAt) {
        doc
          .fontSize(10)
          .text(
            `Released: ${new Date(labResult.releasedAt).toLocaleString()}`,
          );
      }

      doc.moveDown(2);

      // Footer
      doc
        .fontSize(8)
        .text(
          `This document was generated from ${tenantName} Hospital Management System.`,
          { align: 'center' },
        );

      doc.end();
    });
  }

  /**
   * Generate a PDF invoice document.
   */
  async generateInvoicePdf(data: {
    invoice: any;
    patient: any;
    tenantName: string;
    payments: any[];
  }): Promise<Buffer> {
    const { invoice, patient, tenantName, payments } = data;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(18).text(tenantName, { align: 'center' });
      doc.fontSize(14).text('Invoice', { align: 'center' });
      doc
        .fontSize(10)
        .text(`Invoice #: ${invoice.invoiceNumber || 'N/A'}`, {
          align: 'center',
        });
      doc.moveDown();

      // Patient info
      doc.fontSize(12).text('Patient Information', { underline: true });
      doc
        .fontSize(10)
        .text(
          `Name: ${patient.firstName} ${patient.lastName}`,
        );
      doc.text(`Patient Number: ${patient.patientNumber}`);
      doc.moveDown();

      // Invoice details
      doc.fontSize(12).text('Invoice Details', { underline: true });
      doc.fontSize(10).text(`Total Amount: ${invoice.totalAmount}`);
      doc.text(`Paid Amount: ${invoice.paidAmount}`);
      const balance =
        Number(invoice.totalAmount) - Number(invoice.paidAmount);
      doc.text(`Balance: ${balance.toFixed(2)}`);
      doc.text(`Status: ${invoice.status}`);
      doc.moveDown();

      // Payment history
      if (payments && payments.length > 0) {
        doc.fontSize(12).text('Payment History', { underline: true });
        doc.moveDown(0.5);

        doc
          .fontSize(9)
          .text(
            this.padColumns([
              'Receipt #',
              'Amount',
              'Method',
              'Status',
              'Date',
            ]),
          );
        doc.text('─'.repeat(80));

        for (const payment of payments) {
          doc.text(
            this.padColumns([
              payment.receiptNumber || '-',
              String(payment.amount),
              payment.paymentMethod || '-',
              payment.status || '-',
              payment.createdAt
                ? new Date(payment.createdAt).toLocaleDateString()
                : '-',
            ]),
          );
        }
        doc.moveDown();
      }

      doc.moveDown(2);

      // Footer
      doc
        .fontSize(8)
        .text(
          `This document was generated from ${tenantName} Hospital Management System.`,
          { align: 'center' },
        );
      doc.text(
        'This is an official invoice document. Please retain for your records.',
        { align: 'center' },
      );

      doc.end();
    });
  }

  /**
   * Generate a PDF prescription document.
   */
  async generatePrescriptionPdf(data: {
    prescription: any;
    patient: any;
    tenantName: string;
  }): Promise<Buffer> {
    const { prescription, patient, tenantName } = data;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(18).text(tenantName, { align: 'center' });
      doc.fontSize(14).text('Prescription', { align: 'center' });
      doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString()}`, {
        align: 'center',
      });
      doc.moveDown();

      // Patient info
      doc.fontSize(12).text('Patient Information', { underline: true });
      doc
        .fontSize(10)
        .text(
          `Name: ${patient.firstName} ${patient.lastName}`,
        );
      doc.text(`Patient Number: ${patient.patientNumber}`);
      doc.moveDown();

      // Medication details
      doc.fontSize(12).text('Medication', { underline: true });
      doc
        .fontSize(10)
        .text(`Medication Name: ${prescription.medicationName}`);
      doc.text(`Dosage: ${prescription.dosage}`);
      doc.text(`Frequency: ${prescription.frequency}`);
      doc.text(`Duration: ${prescription.duration}`);
      if (prescription.notes) {
        doc.text(`Notes: ${prescription.notes}`);
      }
      doc.moveDown();

      // Prescriber info
      if (prescription.prescribedBy) {
        doc.fontSize(12).text('Prescriber', { underline: true });
        doc.fontSize(10).text(`Email: ${prescription.prescribedBy.email}`);
        doc.moveDown();
      }

      doc.moveDown(2);

      // Footer
      doc
        .fontSize(8)
        .text(
          `This document was generated from ${tenantName} Hospital Management System.`,
          { align: 'center' },
        );
      doc.text(
        'This prescription is valid only when issued by a licensed physician. Do not self-medicate.',
        { align: 'center' },
      );

      doc.end();
    });
  }

  /**
   * Generate a PDF receipt for a specific payment.
   */
  async generateReceiptPdf(data: {
    payment: any;
    patient: any;
    tenantName: string;
  }): Promise<Buffer> {
    const { payment, patient, tenantName } = data;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(18).text(tenantName, { align: 'center' });
      doc.fontSize(14).text('Official Receipt', { align: 'center' });
      doc
        .fontSize(10)
        .text(`Receipt #: ${payment.receiptNumber || 'N/A'}`, {
          align: 'center',
        });
      doc.moveDown();

      // Patient info
      doc.fontSize(12).text('Patient Information', { underline: true });
      doc
        .fontSize(10)
        .text(
          `Name: ${patient.firstName} ${patient.lastName}`,
        );
      doc.text(`Patient Number: ${patient.patientNumber}`);
      doc.moveDown();

      // Payment details
      doc.fontSize(12).text('Payment Details', { underline: true });
      doc.fontSize(10).text(`Amount Paid: ${payment.amount}`);
      doc.text(`Payment Method: ${payment.paymentMethod}`);
      doc.text(`Status: ${payment.status}`);
      doc.text(
        `Date: ${new Date(payment.createdAt).toLocaleString()}`,
      );
      doc.moveDown();

      // Invoice reference
      if (payment.invoice) {
        doc
          .fontSize(10)
          .text(
            `Applied to Invoice #: ${payment.invoice.invoiceNumber || 'N/A'}`,
          );
      }

      doc.moveDown(2);

      // Footer
      doc
        .fontSize(8)
        .text(
          `This document was generated from ${tenantName} Hospital Management System.`,
          { align: 'center' },
        );
      doc.text('Thank you for your payment.', { align: 'center' });

      doc.end();
    });
  }

  /**
   * Pad column values for simple text-table alignment.
   */
  private padColumns(columns: string[]): string {
    const widths = [20, 12, 10, 18, 8];
    return columns
      .map((col, i) => col.padEnd(widths[i] || 15))
      .join(' ');
  }
}
