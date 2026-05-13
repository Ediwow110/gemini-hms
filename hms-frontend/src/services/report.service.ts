import { apiClient } from "../lib/api";

export interface ReportExport {
  id: string;
  reportType: 'CASHIER_REVERSAL_RECONCILIATION' | 'AUDIT_EVENTS_SUMMARY';
  status: 'CREATED' | 'COMPLETED' | 'FAILED';
  rowCount: number;
  reason: string;
  fileId?: string;
  createdAt: string;
  completedAt?: string;
}

export const reportService = {
  getHistory: async (): Promise<ReportExport[]> => {
    const response = await apiClient.get("/v1/reports/history");
    return response.data;
  },

  createExport: async (reportType: string, reason: string): Promise<ReportExport> => {
    const response = await apiClient.post("/v1/reports/exports", {
      reportType,
      reason,
      filters: {},
    });
    return response.data;
  },

  downloadExport: async (id: string, fileName: string) => {
    const response = await apiClient.get(`/v1/reports/exports/${id}/download`, {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
