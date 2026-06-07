import { apiClient } from '../lib/api';
import { demoData } from '../demo-data/dashboard-demo.data';

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
  revenueTrend: { label: string; value: number }[];
  isDemoData?: boolean;
}

export const billingDashboardService = {
  async getDashboardData(branchId: string): Promise<BillingDashboardData> {
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
        paymentMethodDistribution: demoData.billing.paymentMethodDistribution,
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
        revenueTrend: [
          { label: 'Mon', value: 12500 },
          { label: 'Tue', value: 18400 },
          { label: 'Wed', value: 14200 },
          { label: 'Thu', value: 23100 },
          { label: 'Fri', value: 21800 },
          { label: 'Sat', value: 9500 },
          { label: 'Sun', value: 11000 },
        ],
        isDemoData: false,
      };
    } catch (error) {
      console.warn('Billing dashboard data fetch failed, falling back to mock data:', error);
      return {
        kpis: [
          { title: 'Current Session', value: '₱42,500', description: 'Active cashier total (Demo)', severity: 'success' as const },
          { title: 'Unpaid Invoices', value: 18, description: 'Pending payment (Demo)', severity: 'warning' as const },
          { title: 'Overdue Bills', value: 5, description: 'Past due date (Demo)', severity: 'critical' as const },
          { title: 'Total Outstanding', value: '₱184,200', description: 'Total receivables (Demo)', severity: 'info' as const },
        ],
        alerts: [
          { id: 'overdue-1', title: 'Overdue Invoice', message: 'Invoice INV-2026-001 is overdue by 5 days', severity: 'critical' as const },
          { id: 'overdue-2', title: 'Overdue Invoice', message: 'Invoice INV-2026-004 is overdue by 3 days', severity: 'critical' as const },
        ],
        invoiceStatusDistribution: [
          { label: 'Paid', value: 45 },
          { label: 'Unpaid', value: 18 },
          { label: 'Overdue', value: 5 },
        ],
        paymentMethodDistribution: demoData.billing.paymentMethodDistribution,
        highestOutstanding: [
          { id: 'out-1', label: 'St. Jude Health Plan', value: '₱85,000', trend: 'UNPAID' },
          { id: 'out-2', label: 'Sample Client A', value: '₱45,000', trend: 'UNPAID' },
          { id: 'out-3', label: 'Sample Client B', value: '₱32,000', trend: 'UNPAID' },
          { id: 'out-4', label: 'Apex Insurance Co.', value: '₱12,500', trend: 'UNPAID' },
          { id: 'out-5', label: 'Sample Client C', value: '₱9,700', trend: 'UNPAID' },
        ],
        recentPayments: [
          { id: 'pay-1', label: 'INV-2026-002', value: '₱15,200', trend: 'POSTED' },
          { id: 'pay-2', label: 'INV-2026-003', value: '₱8,500', trend: 'POSTED' },
          { id: 'pay-3', label: 'INV-2026-005', value: '₱12,000', trend: 'POSTED' },
          { id: 'pay-4', label: 'INV-2026-006', value: '₱4,800', trend: 'POSTED' },
          { id: 'pay-5', label: 'INV-2026-007', value: '₱2,000', trend: 'POSTED' },
        ],
        revenueTrend: [
          { label: 'Mon', value: 12500 },
          { label: 'Tue', value: 18400 },
          { label: 'Wed', value: 14200 },
          { label: 'Thu', value: 23100 },
          { label: 'Fri', value: 21800 },
          { label: 'Sat', value: 9500 },
          { label: 'Sun', value: 11000 },
        ],
        isDemoData: true,
      };
    }
  },
};
