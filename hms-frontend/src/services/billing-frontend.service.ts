import { apiClient } from '../lib/api';

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  balance?: number;
  createdAt: string;
  patientName?: string;
}

export interface ActiveSessionDto {
  id: string;
  status: string;
  openedAt: string;
  openingFloat: number;
}

export class BillingFrontendService {
  private baseUrl = '/api/v1/billing';

  async getInvoices(): Promise<InvoiceDto[]> {
    const res = await apiClient.get(`${this.baseUrl}/invoices`);
    return res.data;
  }

  async getActiveSession(): Promise<ActiveSessionDto | null> {
    try {
      const res = await apiClient.get(`${this.baseUrl}/sessions/active`);
      return res.data;
    } catch {
      return null;
    }
  }
}

export const billingFrontendService = new BillingFrontendService();
