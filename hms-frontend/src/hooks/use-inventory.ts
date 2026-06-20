import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory.service';

export const useInventoryCatalog = () => {
  return useQuery({
    queryKey: ['inventory', 'catalog'],
    queryFn: () => inventoryService.getCatalog(),
    retry: false,
  });
};

export const useReceiveStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      itemId: string;
      quantity: number;
      supplierName?: string;
      remarks?: string;
    }) =>
      inventoryService.receiveStock(payload.itemId, {
        quantity: payload.quantity,
        supplierName: payload.supplierName,
        remarks: payload.remarks,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'catalog'] });
    },
  });
};
