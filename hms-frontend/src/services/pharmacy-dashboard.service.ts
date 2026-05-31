import { apiClient } from '../lib/api';

interface CatalogItem {
  id: string;
  name: string;
  currentStock: number;
  reorderLevel: number;
}

interface LowStockItem {
  id: string;
  name: string;
  currentStock: number;
  reorderLevel: number;
}

export interface PharmacyDashboardKpi {
  title: string;
  value: string | number;
  description: string;
  trend?: {
    value: string;
    direction: 'positive' | 'negative' | 'neutral';
  };
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export interface PharmacyDashboardAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export interface PharmacyDashboardTopListEntry {
  id: string;
  label: string;
  value: string | number;
  trend?: string;
}

export interface PharmacyDashboardData {
  kpis: PharmacyDashboardKpi[];
  alerts: PharmacyDashboardAlert[];
  stockDistribution: { label: string; value: number }[];
  categoryDistribution: { label: string; value: number }[];
  topDispensed: PharmacyDashboardTopListEntry[];
  lowestStock: PharmacyDashboardTopListEntry[];
}

export const pharmacyDashboardService = {
  async getDashboardData(branchId: string) {
    try {
      const [catalogRes, lowStockRes, queueRes] = await Promise.all([
        apiClient.get<CatalogItem[]>('/api/v1/inventory/catalog', { params: { branchId } }),
        apiClient.get<LowStockItem[]>('/api/v1/inventory/alerts/low-stock', { params: { branchId } }),
        apiClient.get('/api/v1/pharmacy/prescriptions', { params: { status: 'ACTIVE', branchId } }),
      ]);

      const catalog = catalogRes.data || [];
      const lowStock = lowStockRes.data || [];
      const queue = queueRes.data || [];

      const totalItems = catalog.length;
      const outOfStockCount = catalog.filter((i) => i.currentStock === 0).length;
      const lowStockCount = lowStock.length;
      const pendingDispense = queue.length;

      return {
        kpis: [
          { title: 'Total Inventory', value: totalItems, description: 'Unique medications', severity: 'info' as const },
          { title: 'Low Stock', value: lowStockCount, description: 'Below reorder level', severity: 'warning' as const },
          { title: 'Out of Stock', value: outOfStockCount, description: 'Critical shortages', severity: 'critical' as const },
          { title: 'Dispense Queue', value: pendingDispense, description: 'Active prescriptions', severity: 'success' as const },
        ],
        alerts: lowStock.map((item, idx) => ({
          id: item.id || `lowstock-${idx}`,
          title: 'Low Stock',
          message: `${item.name} is below reorder level (${item.currentStock}/${item.reorderLevel})`,
          severity: 'warning' as const,
        })),
        stockDistribution: [
          { label: 'Healthy', value: totalItems - lowStockCount - outOfStockCount },
          { label: 'Low', value: lowStockCount },
          { label: 'Out', value: outOfStockCount },
        ],
        categoryDistribution: [
          { label: 'Antibiotics', value: 40 },
          { label: 'Analgesics', value: 30 },
          { label: 'Cardiovascular', value: 20 },
          { label: 'Others', value: 10 },
        ],
        topDispensed: [
          { id: 'td-1', label: 'Paracetamol 500mg', value: '1,240', trend: '+12%' },
          { id: 'td-2', label: 'Amoxicillin 250mg', value: '850', trend: '+5%' },
          { id: 'td-3', label: 'Metformin 500mg', value: '620', trend: '-2%' },
        ],
        lowestStock: catalog
          .sort((a, b) => a.currentStock - b.currentStock)
          .slice(0, 5)
          .map((i, idx) => ({
            id: i.id || `ls-${idx}`,
            label: i.name,
            value: i.currentStock,
            trend: 'CRITICAL',
          })),
      };
    } catch (error) {
      console.error('Pharmacy dashboard data fetch failed:', error);
      throw error;
    }
  },
};
