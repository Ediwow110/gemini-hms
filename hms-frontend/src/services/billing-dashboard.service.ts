import { apiClient } from '../lib/api';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  status: string;
  balance: number;
  patientName?: string;
}

interface SessionPayment {
  id: string;
  amount: number;
  paymentMethod: string;
  invoice: {
    invoiceNumber: string;
  };
}

export interface BillingDashboardKpi {
  title: string;
  value: string | number;
  description: string;
  trend?: {
    value: string;
    direction: 'positive' | 'negative' | 'neutral';
  };
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export interface BillingDashboardAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export interface BillingDashboardTopListEntry {
  id: string;
  label: string;
  value: string | number;
  trend?: string;
}

export interface BillingDashboardData {
  kpis: BillingDashboardKpi[];
  alerts: BillingDashboardAlert[];
  invoiceStatusDistribution: { label: string; value: number }[];
  paymentMethodDistribution: { label: string; value: number }[];
  highestOutstanding: BillingDashboardTopListEntry[];
  recentPayments: BillingDashboardTopListEntry[];
}

export const billingDashboardService = {
  async getDashboardData(branchId: string) {
    try {
      const [invoicesRes, sessionRes] = await Promise.all([
        apiClient.get<InvoiceItem[]>('/v1/billing/invoices', { params: { branchId } }),
        apiClient.get<{ payments: SessionPayment[] } | null>('/v1/billing/sessions/active', { params: { branchId } }),
      ]);

      const invoices = invoicesRes.data || [];
      const session = sessionRes.data;

      const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
      const unpaidCount = invoices.filter((inv) => inv.status === 'UNPAID').length;
      const overdueCount = invoices.filter((inv) => inv.status === 'OVERDUE').length;
      const sessionTotal = session?.payments.reduce((sum, p) => sum + p.amount, 0) || 0;

      return {
        kpis: [
          { title: 'Current Session', value: `₱${sessionTotal.toLocaleString()}`, description: 'Active cashier total', severity: 'success' as const },
          { title: 'Unpaid Invoices', value: unpaidCount, description: 'Pending payment', severity: 'warning' as const },
          { title: 'Overdue Bills', value: overdueCount, description: 'Past due date', severity: 'critical' as const },
          { title: 'Total Outstanding', value: `₱${totalOutstanding.toLocaleString()}`, description: 'Total receivables', severity: 'info' as const },
        ],
        alerts: invoices
          .filter((inv) => inv.status === 'OVERDUE')
          .slice(0, 5)
          .map((inv, idx) => ({
            id: inv.id || `overdue-${idx}`,
            title: 'Overdue Invoice',
            message: `Invoice ${inv.invoiceNumber} is overdue`,
            severity: 'critical' as const,
          })),
        invoiceStatusDistribution: [
          { label: 'Paid', value: invoices.filter((inv) => inv.status === 'PAID').length },
          { label: 'Unpaid', value: unpaidCount },
          { label: 'Overdue', value: overdueCount },
        ],
        paymentMethodDistribution: [
          { label: 'Cash', value: 60 },
          { label: 'Credit Card', value: 25 },
          { label: 'Insurance', value: 15 },
        ],
        highestOutstanding: invoices
          .sort((a, b) => (b.balance || 0) - (a.balance || 0))
          .slice(0, 5)
          .map((inv, idx) => ({
            id: inv.id || `out-${idx}`,
            label: inv.patientName || `Inv ${inv.invoiceNumber}`,
            value: `₱${(inv.balance || 0).toLocaleString()}`,
            trend: 'UNPAID',
          })),
        recentPayments: session?.payments.slice(0, 5).map((p, idx) => ({
          id: p.id || `pay-${idx}`,
          label: p.invoice.invoiceNumber,
          value: `₱${p.amount.toLocaleString()}`,
          trend: 'POSTED',
        })) || [],
      };
    } catch (error) {
      console.error('Billing dashboard data fetch failed:', error);
      throw error;
    }
  },
};
