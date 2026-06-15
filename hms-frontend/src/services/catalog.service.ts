import { apiClient } from '../lib/api';

export interface CatalogCategoryDto {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface CatalogItemDto {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  categoryId: string;
  category?: CatalogCategoryDto;
  currentPrice?: number | null;
}

export interface CatalogFormData {
  name: string;
  code?: string;
  description: string;
  categoryId?: string;
  isActive: boolean;
}

export const catalogService = {
  getCategories: async (): Promise<CatalogCategoryDto[]> => {
    const response = await apiClient.get('/v1/catalog/categories?includeInactive=true');
    return response.data;
  },

  getItems: async (): Promise<CatalogItemDto[]> => {
    const response = await apiClient.get('/v1/catalog/items?includeInactive=true');
    return response.data;
  },

  createItem: async (data: CatalogFormData): Promise<void> => {
    await apiClient.post('/v1/catalog/items', data);
  },

  updateItem: async (id: string, data: CatalogFormData): Promise<void> => {
    await apiClient.patch(`/v1/catalog/items/${id}`, data);
  },

  createCategory: async (data: Omit<CatalogFormData, 'code' | 'categoryId'>): Promise<void> => {
    await apiClient.post('/v1/catalog/categories', data);
  },

  updateCategory: async (id: string, data: Omit<CatalogFormData, 'code' | 'categoryId'>): Promise<void> => {
    await apiClient.patch(`/v1/catalog/categories/${id}`, data);
  },
};
