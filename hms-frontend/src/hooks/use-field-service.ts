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
    queryFn: async () => [
      {
        id: 'PM-2026-0421',
        asset: { model: 'Roche cobas c 311', location: 'Metro Central' },
        status: 'SCHEDULED' as const,
      },
      {
        id: 'PM-2026-0422',
        asset: { model: 'Roche cobas c 311', location: 'Metro Central' },
        status: 'IN_PROGRESS' as const,
      },
    ],
    retry: false,
  });
};

export const useFieldServiceServiceTicket = () => {
  return useQuery({
    queryKey: ['field-service', 'service-ticket'],
    queryFn: async () => ({
      id: 'TKT-2026-001',
      asset: 'GE Voluson E10 ultrasound',
      serialNumber: '9918-XYZ-2026',
      priority: 'HIGH' as const,
      status: 'OPEN' as const,
      issue: 'Display Flickering',
    }),
    retry: false,
  });
};

export const useFieldServiceTechnicianSchedule = () => {
  return useQuery({
    queryKey: ['field-service', 'technician-schedule'],
    queryFn: async () => {
      const days = ['MON 21', 'TUE 22', 'WED 23', 'THU 24', 'FRI 25', 'SAT 26', 'SUN 27'];
      return days.map((day, i) => ({
        day,
        jobs: [
          {
            id: 1042 + i,
            customer: 'Metro Central Hospital',
            location: 'Floor 4, Radiology',
            time: `${8 + i}:00 AM`,
            duration: '2.5 Hrs',
          },
        ],
      }));
    },
    retry: false,
  });
};

export const useFieldServiceWarrantyActivation = () => {
  return useQuery({
    queryKey: ['field-service', 'warranty-activation'],
    queryFn: async () => ({
      assetId: 'GE-V10-9918',
      startDate: 'May 21, 2026',
      endDate: 'May 21, 2029',
    }),
    retry: false,
  });
};

export const useFieldServiceHandoverChecklist = () => {
  return useQuery({
    queryKey: ['field-service', 'handover-checklist'],
    queryFn: async () => ({
      jobId: 'INS-2026-0042',
      asset: 'GE Voluson E10 ultrasound',
      serialNumber: '9918-XYZ-2026',
      tasks: [
        'Delivered item verified against PO',
        'Physical installation complete',
        'Power & grounding tested',
        'Software configuration finalized',
        'Calibration passed & verified',
        'User basic training completed',
        'Warranty terms explained',
      ],
    }),
    retry: false,
  });
};

export const useFieldServiceOfflineSync = () => {
  return useQuery({
    queryKey: ['field-service', 'offline-sync'],
    queryFn: async () => ({
      pendingCount: 3,
      items: [
        { id: '1', type: 'HANDOVER', label: 'Handover INS-2026-0042' },
        { id: '2', type: 'PHOTO', label: 'Installation photos (3)' },
        { id: '3', type: 'SIGNATURE', label: 'Delivery signature DEL-9918' },
      ],
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
