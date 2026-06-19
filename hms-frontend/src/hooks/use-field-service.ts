import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldServiceService, type InstallationJobDto } from '../services/field-service.service';

export const useFieldServiceJobs = () => {
  return useQuery({
    queryKey: ['field-service', 'technician-jobs'],
    queryFn: () => fieldServiceService.getTechnicianJobs(),
    retry: false,
  });
};

export const useFieldServiceInstallations = () => {
  return useQuery({
    queryKey: ['field-service', 'installations'],
    queryFn: () => fieldServiceService.getInstallations(),
    retry: false,
  });
};

export const useFieldServiceShipments = () => {
  return useQuery({
    queryKey: ['field-service', 'shipments'],
    queryFn: () => fieldServiceService.getShipments(),
    retry: false,
  });
};

export const useUpdateInstallationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InstallationJobDto['status'] }) =>
      fieldServiceService.updateInstallationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-service', 'installations'] });
      queryClient.invalidateQueries({ queryKey: ['field-service', 'technician-jobs'] });
    },
  });
};

export const useFieldServicePreventiveMaintenance = () => {
  return useQuery({
    queryKey: ['field-service', 'preventive-maintenance'],
    queryFn: async () => [] as Array<{
      id: string;
      asset: { model: string; location: string };
      status: 'SCHEDULED' | 'IN_PROGRESS';
    }>,
    retry: false,
  });
};

export const useFieldServiceServiceTicket = () => {
  return useQuery({
    queryKey: ['field-service', 'service-ticket'],
    queryFn: async () => ({
      id: '',
      asset: '',
      serialNumber: '',
      priority: 'LOW' as const,
      status: 'OPEN' as const,
      issue: '',
    }),
    retry: false,
  });
};

export const useFieldServiceTechnicianSchedule = () => {
  return useQuery({
    queryKey: ['field-service', 'technician-schedule'],
    queryFn: async () => [] as Array<{
      day: string;
      jobs: Array<{
        id: number;
        customer: string;
        location: string;
        time: string;
        duration: string;
      }>;
    }>,
    retry: false,
  });
};

export const useFieldServiceWarrantyActivation = () => {
  return useQuery({
    queryKey: ['field-service', 'warranty-activation'],
    queryFn: async () => ({
      assetId: '',
      startDate: '',
      endDate: '',
    }),
    retry: false,
  });
};

export const useFieldServiceHandoverChecklist = () => {
  return useQuery({
    queryKey: ['field-service', 'handover-checklist'],
    queryFn: async () => ({
      jobId: '',
      asset: '',
      serialNumber: '',
      tasks: [] as string[],
    }),
    retry: false,
  });
};

export const useFieldServiceOfflineSync = () => {
  return useQuery({
    queryKey: ['field-service', 'offline-sync'],
    queryFn: async () => ({
      pendingCount: 0,
      items: [] as Array<{ id: string; type: string; label: string }>,
    }),
    retry: false,
  });
};

export const useFieldServiceProofOfDelivery = () => {
  return useQuery({
    queryKey: ['field-service', 'proof-of-delivery'],
    queryFn: async () => ({
      jobId: 'DEL-9918',
      recipientName: '',
      hasPhoto: false,
      hasSignature: false,
    }),
    retry: false,
  });
};
