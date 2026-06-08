import { useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogService } from '../services/catalog.service';

export const useCatalogCategories = () => {
  return useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: () => catalogService.getCategories(),
    retry: false,
  });
};

export const useCatalogItems = () => {
  return useQuery({
    queryKey: ['catalog', 'items'],
    queryFn: () => catalogService.getItems(),
    retry: false,
  });
};

export const useInvalidateCatalog = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['catalog', 'categories'] });
    queryClient.invalidateQueries({ queryKey: ['catalog', 'items'] });
  };
};
