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
  order?: {
    patient?: {
      id?: string;
      firstName: string;
      lastName: string;
      patientNumber?: string;
    };
  };
}

export interface ActiveSessionDto {
  id: string;
  status: string;
  openedAt: string;
  openingBalance: number; // matched backend field
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
    reversals?: Array<{
      id: string;
      amount: number;
      type: string;
    }>;
    invoice: {
      invoiceNumber: string;
      order: {
        patient: {
          firstName: string;
          lastName: string;
        };
      };
    };
  }>;
}

export interface OpenSessionDto {
  branchId: string;
  openingBalance: number;
}

export interface CloseSessionDto {
  actualClosingBalance: number;
  remarks?: string;
}

export interface CreatePaymentDto {
  invoiceId: string;
  cashierSessionId: string;
  amount: number;
  paymentMethod: string;
}

export class BillingFrontendService {
  private baseUrl = '/v1/billing';

  async getInvoices(): Promise<InvoiceDto[]> {
    const res = await apiClient.get(`${this.baseUrl}/invoices`);
    return res.data;
  }

  async getActiveSession(): Promise<ActiveSessionDto | null> {
    const res = await apiClient.get(`${this.baseUrl}/sessions/active`);
    return res.data;
  }

  async openSession(dto: OpenSessionDto): Promise<ActiveSessionDto> {
    const res = await apiClient.post(`${this.baseUrl}/sessions/open`, dto);
    return res.data;
  }

  async closeSession(id: string, dto: CloseSessionDto): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/sessions/${id}/close`, dto);
  }

  async postPayment(dto: CreatePaymentDto, idempotencyKey: string): Promise<unknown> {
    const res = await apiClient.post(`${this.baseUrl}/payments`, dto, {
      headers: { 'idempotency-key': idempotencyKey }
    });
    return res.data;
  }
}

export const billingFrontendService = new BillingFrontendService();

