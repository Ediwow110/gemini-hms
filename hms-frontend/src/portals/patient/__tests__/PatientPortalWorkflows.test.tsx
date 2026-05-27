import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReleasedResultCard } from '../components/ReleasedResultCard';
import { PatientBillingSummary } from '../components/PatientBillingSummary';
import { ActivePrescriptionCard } from '../components/ActivePrescriptionCard';
import { PatientMedicalRecordsPage } from '../PatientMedicalRecordsPage';
import { patientPortalService } from '../../../services/patient-portal.service';
import * as downloadHelper from '../../../lib/download-file';

// Mock dependencies
vi.mock('../../../services/patient-portal.service', () => ({
  patientPortalService: {
    downloadLabResultPdf: vi.fn(),
    downloadInvoicePdf: vi.fn(),
    downloadReceiptPdf: vi.fn(),
    downloadPrescriptionPdf: vi.fn(),
    createRefillRequest: vi.fn(),
    createMedicalRecordRequest: vi.fn(),
    getMedicalRecordRequests: vi.fn().mockResolvedValue([]),
  }
}));

vi.mock('../../../hooks/use-patient-portal', () => ({
  usePatientMedicalRecordRequests: () => ({
    requests: [],
    loading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('../../../lib/download-file', () => ({
  downloadBlob: vi.fn(),
}));

describe('Patient Portal Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ReleasedResultCard', () => {
    const mockResults = [
      { id: '1', testName: 'CBC', dateReleased: '2023-01-01', doctorName: 'Dr. Smith', status: 'NORMAL' as const, isReleased: true }
    ];

    it('should call API and download helper on download click', async () => {
      const mockBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
      vi.mocked(patientPortalService.downloadLabResultPdf).mockResolvedValue(mockBlob);

      render(<ReleasedResultCard results={mockResults} />);
      
      const downloadBtn = screen.getByTitle('Download PDF');
      fireEvent.click(downloadBtn);

      await waitFor(() => {
        expect(patientPortalService.downloadLabResultPdf).toHaveBeenCalledWith('1');
        expect(downloadHelper.downloadBlob).toHaveBeenCalledWith(mockBlob, expect.stringContaining('lab-result-cbc'));
      });
    });

    it('should handle errors gracefully', async () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleMock = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(patientPortalService.downloadLabResultPdf).mockRejectedValue(new Error('Network error'));

      render(<ReleasedResultCard results={mockResults} />);
      
      const downloadBtn = screen.getByTitle('Download PDF');
      fireEvent.click(downloadBtn);

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Failed to download lab result. Please try again.');
        expect(consoleMock).toHaveBeenCalled();
      });

      alertMock.mockRestore();
      consoleMock.mockRestore();
    });
  });

  describe('PatientBillingSummary', () => {
    const mockInvoices = [
      { id: 'inv-1', service: 'Consultation', amount: 500, date: '2023-01-01', status: 'PAID' as const, latestPostedPaymentId: 'pay-1' },
      { id: 'inv-2', service: 'Lab Test', amount: 300, date: '2023-01-02', status: 'UNPAID' as const, latestPostedPaymentId: null }
    ];

    it('should call API and download helper on download invoice', async () => {
      const mockBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
      vi.mocked(patientPortalService.downloadInvoicePdf).mockResolvedValue(mockBlob);

      render(<PatientBillingSummary invoices={mockInvoices} outstandingBalance={300} />);
      
      const downloadBtns = screen.getAllByTitle('Download Invoice PDF');
      fireEvent.click(downloadBtns[0]);

      await waitFor(() => {
        expect(patientPortalService.downloadInvoicePdf).toHaveBeenCalledWith('inv-1');
        expect(downloadHelper.downloadBlob).toHaveBeenCalledWith(mockBlob, expect.stringContaining('invoice-consultation'));
      });
    });

    it('should call API and download helper on download receipt', async () => {
      const mockBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
      vi.mocked(patientPortalService.downloadReceiptPdf).mockResolvedValue(mockBlob);

      render(<PatientBillingSummary invoices={mockInvoices} outstandingBalance={300} />);
      
      const receiptBtn = screen.getByTitle('Download Receipt PDF');
      fireEvent.click(receiptBtn);

      await waitFor(() => {
        expect(patientPortalService.downloadReceiptPdf).toHaveBeenCalledWith('pay-1');
        expect(downloadHelper.downloadBlob).toHaveBeenCalledWith(mockBlob, expect.stringContaining('receipt-consultation'));
      });
    });

    it('should disable receipt button if no paymentId exists', () => {
      render(<PatientBillingSummary invoices={mockInvoices} outstandingBalance={300} />);
      
      const disabledBtn = screen.getByTitle('Receipt available after payment is posted');
      expect(disabledBtn).toBeDisabled();
    });
  });

  describe('ActivePrescriptionCard', () => {
    const mockPrescriptions = [
      { id: 'rx-1', medication: 'Amoxicillin', dosage: '500mg', frequency: '3x day', prescribedBy: 'Dr. Jones', expiryDate: '2024-01-01', remainingRefills: 2 }
    ];

    it('should call API and download helper on download prescription', async () => {
      const mockBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
      vi.mocked(patientPortalService.downloadPrescriptionPdf).mockResolvedValue(mockBlob);

      render(<ActivePrescriptionCard prescriptions={mockPrescriptions} />);
      
      const downloadBtn = screen.getByTitle('Download PDF');
      fireEvent.click(downloadBtn);

      await waitFor(() => {
        expect(patientPortalService.downloadPrescriptionPdf).toHaveBeenCalledWith('rx-1');
        expect(downloadHelper.downloadBlob).toHaveBeenCalledWith(mockBlob, expect.stringContaining('prescription-amoxicillin'));
      });
    });

    it('should submit refill request to API', async () => {
      const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      // @ts-expect-error - mock return value
      vi.mocked(patientPortalService.createRefillRequest).mockResolvedValue({ id: 'refill-1' });

      render(<ActivePrescriptionCard prescriptions={mockPrescriptions} />);
      
      const requestBtn = screen.getByTitle('Request Refill');
      fireEvent.click(requestBtn);

      await waitFor(() => {
        expect(patientPortalService.createRefillRequest).toHaveBeenCalledWith('rx-1', 'Requested via Patient Portal');
        expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Refill request submitted'));
      });

      confirmMock.mockRestore();
      alertMock.mockRestore();
    });

    it('should disable refill request if no refills remaining', () => {
      const noRefills = [{ ...mockPrescriptions[0], remainingRefills: 0 }];
      render(<ActivePrescriptionCard prescriptions={noRefills} />);
      
      const requestBtn = screen.getByTitle('No refills remaining');
      expect(requestBtn).toBeDisabled();
    });
  });

  describe('PatientMedicalRecordsPage', () => {
    it('should submit medical record request to API', async () => {
      const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      // @ts-expect-error - mock return value
      vi.mocked(patientPortalService.createMedicalRecordRequest).mockResolvedValue({ id: 'mr-1' });

      render(<PatientMedicalRecordsPage />);
      
      const requestBtn = screen.getByText('Request Medical Record Copy');
      fireEvent.click(requestBtn);

      await waitFor(() => {
        expect(patientPortalService.createMedicalRecordRequest).toHaveBeenCalledWith('FULL_RECORD', 'Requested via Patient Portal');
        expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('submitted successfully'));
      });

      confirmMock.mockRestore();
      alertMock.mockRestore();
    });
  });
});
