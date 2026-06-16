import { apiClient } from '../lib/api';
import type { 
  AdminDashboardSummary, 
  AdminDashboardAlertsResponse, 
  AdminDashboardTopListsResponse, 
  TrendPoint, 
  DateRange, 
  ScopeFilter 
} from '../types/analytics';

export interface DashboardService {
  getAdminSummary(filters: Partial<ScopeFilter> & { dateRange?: DateRange }): Promise<AdminDashboardSummary>;
  getAdminTrends(filters: Partial<ScopeFilter> & { dateRange?: DateRange }): Promise<TrendPoint[]>;
  getAdminAlerts(): Promise<AdminDashboardAlertsResponse>;
  getAdminTopLists(): Promise<AdminDashboardTopListsResponse>;
  buildQueryParams(filters: Partial<ScopeFilter> & { dateRange?: DateRange }): Record<string, string>;
}

export const dashboardService: DashboardService = {
  async getAdminSummary(filters) {
    const params = this.buildQueryParams(filters);
    const response = await apiClient.get('/v1/dashboard/admin/summary', { params });
    return response.data;
  },

  async getAdminTrends(filters) {
    const params = this.buildQueryParams(filters);
    if (filters.dimension) params.dimension = filters.dimension;
    const response = await apiClient.get('/v1/dashboard/admin/trends', { params });
    return response.data;
  },

  async getAdminAlerts() {
    const response = await apiClient.get('/v1/dashboard/admin/alerts');
    return response.data;
  },

  async getAdminTopLists() {
    const response = await apiClient.get('/v1/dashboard/admin/top-lists');
    return response.data;
  },

  buildQueryParams(filters: Partial<ScopeFilter> & { dateRange?: DateRange }) {
    const params: Record<string, string> = {};
    if (filters.dateRange?.from) params.dateFrom = filters.dateRange.from;
    if (filters.dateRange?.to) params.dateTo = filters.dateRange.to;
    if (filters.branch && filters.branch !== 'all') params.branchId = filters.branch;
    if (filters.department) params.departmentId = filters.department;
    if (filters.status) params.status = filters.status;
    return params;
  },
};
