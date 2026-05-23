import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyService } from '../services/pharmacy.service';
import type { DispensePrescriptionPayload } from '../services/pharmacy.service';
import { useUser } from './use-user';

export const usePrescriptionQueue = (status?: string) => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: [
      'pharmacy',
      'prescription-queue',
      user?.tenantId,
      user?.branchId,
      user?.id,
      roleScope,
      status,
    ],
    queryFn: () => pharmacyService.getPrescriptionQueue(status),
    enabled: !!user?.tenantId,
    retry: false,
  });
};

export const useDrugCatalog = () => {
  const user = useUser();
  const roleScope = user?.roles?.join(',');
  return useQuery({
    queryKey: [
      'pharmacy',
      'drug-catalog',
      user?.tenantId,
      user?.branchId,
      user?.id,
      roleScope,
    ],
    queryFn: () => pharmacyService.getDrugCatalog(),
    enabled: !!user?.tenantId,
    retry: false,
  });
};

export const useDispenseMedication = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: ({
      prescriptionId,
      data,
    }: {
      prescriptionId: string;
      data: DispensePrescriptionPayload;
    }) => pharmacyService.dispenseMedication(prescriptionId, data),

    onSuccess: () => {
      const roleScope = user?.roles?.join(',');

      queryClient.invalidateQueries({
        queryKey: [
          'pharmacy',
          'prescription-queue',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          'pharmacy',
          'drug-catalog',
          user?.tenantId,
          user?.branchId,
          user?.id,
          roleScope,
        ],
      });
    },
  });
};
