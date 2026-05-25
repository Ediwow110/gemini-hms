import { apiClient } from '../lib/api';

export interface SupportTicketDto {
  id: string;
  tenantId: string;
  branchId?: string;
  reportedById: string;
  assignedToId?: string;
  issueType: string;
  summary: string;
  description?: string;
  status: string;
  priority: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  reportedBy?: { id: string; email: string };
  assignedTo?: { id: string; email: string };
  branch?: { id: string; name: string };
}

export interface PaginatedTickets {
  data: SupportTicketDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TicketStats {
  open: number;
  inProgress: number;
  urgent: number;
  total: number;
}

export class ItSupportService {
  private baseUrl = '/api/v1/it-support';

  async createTicket(data: {
    issueType: string;
    summary: string;
    description?: string;
    priority?: string;
    branchId?: string;
  }): Promise<SupportTicketDto> {
    const res = await apiClient.post(`${this.baseUrl}/tickets`, data);
    return res.data;
  }

  async getTickets(params?: {
    status?: string;
    priority?: string;
    issueType?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedTickets> {
    const res = await apiClient.get(`${this.baseUrl}/tickets`, { params });
    return res.data;
  }

  async getTicketStats(): Promise<TicketStats> {
    const res = await apiClient.get(`${this.baseUrl}/tickets/stats`);
    return res.data;
  }

  async getTicket(id: string): Promise<SupportTicketDto> {
    const res = await apiClient.get(`${this.baseUrl}/tickets/${id}`);
    return res.data;
  }

  async updateTicket(id: string, data: {
    status?: string;
    priority?: string;
    assignedToId?: string;
    resolution?: string;
  }): Promise<SupportTicketDto> {
    const res = await apiClient.patch(`${this.baseUrl}/tickets/${id}`, data);
    return res.data;
  }
}

export const itSupportService = new ItSupportService();
