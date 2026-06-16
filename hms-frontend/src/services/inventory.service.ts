import { apiClient } from '../lib/api';

export type InventoryStatus = 'ACTIVE' | 'INACTIVE';

export interface InventoryCatalogItem {
  id: string;
  name: string;
  sku?: string | null;
  category: string;
  unit: string;
  reorderLevel: number;
  price: number;
  status: InventoryStatus;
  stock: number;
}

export const inventoryService = {
  getCatalog: async (): Promise<InventoryCatalogItem[]> => {
    const response = await apiClient.get('/v1/inventory/catalog');
    return response.data;
  },
};
