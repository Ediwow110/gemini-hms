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

  async getPaymentHistory(page?: number, pageSize?: number): Promise<unknown> {
    const params = new URLSearchParams();
    if (page !== undefined) params.set('page', String(page));
    if (pageSize !== undefined) params.set('pageSize', String(pageSize));
    const res = await apiClient.get(`${this.baseUrl}/payments?${params}`);
    return res.data;
  }

  async confirmPayment(paymentId: string, dto: { gatewayReference: string; gatewayProvider?: string }): Promise<unknown> {
    const res = await apiClient.post(`${this.baseUrl}/payments/${paymentId}/confirm`, dto);
    return res.data;
  }

  async failPayment(paymentId: string, dto: { reason: string; gatewayReference?: string }): Promise<unknown> {
    const res = await apiClient.post(`${this.baseUrl}/payments/${paymentId}/fail`, dto);
    return res.data;
  }

  async expirePayment(paymentId: string, dto: { reason: string }): Promise<unknown> {
    const res = await apiClient.post(`${this.baseUrl}/payments/${paymentId}/expire`, dto);
    return res.data;
  }

  async requestRefund(dto: { paymentId: string; amount: number; reason: string }): Promise<unknown> {
    const res = await apiClient.post(`${this.baseUrl}/refunds/request`, dto);
    return res.data;
  }

  async requestVoid(dto: { paymentId: string; reason: string }): Promise<unknown> {
    const res = await apiClient.post(`${this.baseUrl}/payments/void-request`, dto);
    return res.data;
  }

  async approveVoid(reversalId: string, remarks?: string): Promise<unknown> {
    const res = await apiClient.patch(`${this.baseUrl}/payments/voids/${reversalId}/approve`, { remarks });
    return res.data;
  }

  async rejectVoid(reversalId: string, remarks?: string): Promise<unknown> {
    const res = await apiClient.patch(`${this.baseUrl}/payments/voids/${reversalId}/reject`, { remarks });
    return res.data;
  }

  async approveRefund(reversalId: string, remarks?: string): Promise<unknown> {
    const res = await apiClient.patch(`${this.baseUrl}/refunds/${reversalId}/approve`, { remarks });
    return res.data;
  }

  async rejectRefund(reversalId: string, remarks?: string): Promise<unknown> {
    const res = await apiClient.patch(`${this.baseUrl}/refunds/${reversalId}/reject`, { remarks });
    return res.data;
  }
}

export const billingFrontendService = new BillingFrontendService();

