import { apiClient } from '../lib/api';
import type { PharmacyPrescriptionQueueDto } from './pharmacy.service';

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
  lowestStock: PharmacyDashboardTopListEntry[];
  isUnavailable?: boolean;
  activePrescriptions?: PharmacyPrescriptionQueueDto[];
}

export const pharmacyDashboardService = {
  async getDashboardData(branchId: string): Promise<PharmacyDashboardData> {
    try {
      const [catalogRes, lowStockRes, queueRes] = await Promise.all([
        apiClient.get<CatalogItem[]>('/v1/inventory/catalog', { params: { branchId } }),
        apiClient.get<LowStockItem[]>('/v1/inventory/alerts/low-stock', { params: { branchId } }),
        apiClient.get('/v1/pharmacy/prescriptions', { params: { status: 'ACTIVE', branchId } }),
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
        lowestStock: catalog
          .sort((a, b) => a.currentStock - b.currentStock)
          .slice(0, 5)
          .map((i, idx) => ({
            id: i.id || `ls-${idx}`,
            label: i.name,
            value: i.currentStock,
            trend: 'CRITICAL',
          })),
        isUnavailable: false,
        activePrescriptions: queueRes.data || [],
      };
    } catch (error) {
      console.warn('Pharmacy dashboard data fetch failed, falling back to empty states:', error);
      return {
        kpis: [],
        alerts: [],
        stockDistribution: [],
        lowestStock: [],
        isUnavailable: true,
        activePrescriptions: [],
      };
    }
  },
};
