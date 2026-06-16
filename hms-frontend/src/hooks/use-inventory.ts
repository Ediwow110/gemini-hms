import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory.service';

export const useInventoryCatalog = () => {
  return useQuery({
    queryKey: ['inventory', 'catalog'],
    queryFn: () => inventoryService.getCatalog(),
    retry: false,
  });
};
