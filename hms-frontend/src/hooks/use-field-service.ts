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

/** Admin Oversight Hooks (Mocked) */

export const useFieldServiceWarrantyLogs = () => {
  return useQuery({
    queryKey: ['field-service', 'admin', 'warranty-logs'],
    queryFn: async () => [
      { id: 'AST-901', sn: 'SN-2024-X1', date: '2024-05-12', status: 'Active', activatedBy: 'Alice Smith', customer: 'City General', type: 'Standard', expiry: '2025-05-12' },
      { id: 'AST-905', sn: 'SN-2024-Y2', date: '2024-06-01', status: 'Active', activatedBy: 'Bob Jones', customer: 'St. Jude', type: 'Extended', expiry: '2027-06-01' },
      { id: 'AST-912', sn: 'SN-2024-Z3', date: '2024-06-15', status: 'Pending', activatedBy: 'Charlie Brown', customer: 'Mercy Hospital', type: 'Standard', expiry: '2025-06-15' },
    ],
    retry: false,
  });
};

export const useFieldServiceDeliveryArchives = () => {
  return useQuery({
    queryKey: ['field-service', 'admin', 'delivery-archives'],
    queryFn: async () => [
      { id: 'JOB-101', user: 'Alice Smith', status: 'Delivered', proof: 'Image/Sig', date: '2024-06-10', tech: 'Alice Smith', location: 'Radiology Wing', notes: 'Delivered to Head Nurse' },
      { id: 'JOB-104', user: 'Bob Jones', status: 'Delivered', proof: 'Image/Sig', date: '2024-06-12', tech: 'Bob Jones', location: 'ICU Floor 2', notes: 'Packaging intact' },
      { id: 'JOB-112', user: 'Charlie Brown', status: 'Pending', proof: 'None', date: '---', tech: 'Charlie Brown', location: 'Pharmacy', notes: 'Recipient absent' },
    ],
    retry: false,
  });
};

export const useFieldServiceHandoverLogs = () => {
  return useQuery({
    queryKey: ['field-service', 'admin', 'handover-logs'],
    queryFn: async () => [
      { id: 'JOB-201', customer: 'Acme Corp', progress: '100%', time: '2024-06-10 14:30', asset: 'MRI-S1', tech: 'Alice Smith', signOff: 'Approved', missing: 'None' },
      { id: 'JOB-205', customer: 'Global Health', progress: '100%', time: '2024-06-12 09:15', asset: 'Vent-X2', tech: 'Bob Jones', signOff: 'Approved', missing: 'None' },
      { id: 'JOB-210', customer: 'City General', progress: '40%', time: '---', asset: 'Pump-P3', tech: 'Charlie Brown', signOff: 'Pending', missing: 'User Manual' },
    ],
    retry: false,
  });
};

export const useFieldServiceMaintenanceSLA = () => {
  return useQuery({
    queryKey: ['field-service', 'admin', 'maintenance-sla'],
    queryFn: async () => [
      { id: 'AST-101', sla: 'Compliant', tech: 'Alice Smith', date: '2024-05-01', nextDue: '2024-11-01', model: 'MRI-S1', priority: 'Medium', compliance: '100%' },
      { id: 'AST-205', sla: 'At Risk', tech: 'Bob Jones', date: '2024-04-15', nextDue: '2024-10-15', model: 'Vent-X2', priority: 'High', compliance: '85%' },
      { id: 'AST-312', sla: 'Overdue', tech: 'Charlie Brown', date: '2024-03-10', nextDue: '2024-09-10', model: 'Pump-P3', priority: 'Critical', compliance: '60%' },
    ],
    retry: false,
  });
};

export const useFieldServiceWorklogHistory = () => {
  return useQuery({
    queryKey: ['field-service', 'admin', 'worklog-history'],
    queryFn: async () => [
      { id: 'TKT-501', tech: 'Alice Smith', hours: '4.5h', status: 'Completed', asset: 'AST-101', category: 'Calibration', date: '2024-06-14', summary: 'Re-calibrated sensor array' },
      { id: 'TKT-504', tech: 'Bob Jones', hours: '2.0h', status: 'In Progress', asset: 'AST-205', category: 'Hardware', date: '2024-06-15', summary: 'Replacing power supply' },
      { id: 'TKT-512', tech: 'Charlie Brown', hours: '1.5h', status: 'Pending', asset: 'AST-312', category: 'Software', date: '2024-06-16', summary: 'OS update pending' },
    ],
    retry: false,
  });
};

export const useFieldServiceSyncInfrastructure = () => {
  return useQuery({
    queryKey: ['field-service', 'admin', 'sync-infra'],
    queryFn: async () => ({
      relayHealth: 'Operational',
      avgLatency: '124ms',
      totalPending: 42,
      errorRate: '1.2%',
      stuckUsers: [
        { id: 'TECH-01', name: 'John Doe', lastSync: '26h ago', pending: 5 },
        { id: 'TECH-05', name: 'Jane Roe', lastSync: '31h ago', pending: 12 },
      ],
    }),
    retry: false,
  });
};

export const useFieldServiceTechUtilization = () => {
  return useQuery({
    queryKey: ['field-service', 'admin', 'tech-utilization'],
    queryFn: async () => [
      { tech: 'Alice Smith', load: '6 Jobs', util: '92%', status: 'On Route', location: 'North Zone', overtime: '2h', nextJob: 'JOB-401' },
      { tech: 'Bob Jones', load: '4 Jobs', util: '65%', status: 'On Route', location: 'South Zone', overtime: '0h', nextJob: 'JOB-405' },
      { tech: 'Charlie Brown', load: '7 Jobs', util: '105%', status: 'Delayed', location: 'East Zone', overtime: '5h', nextJob: 'JOB-412' },
    ],
    retry: false,
  });
};
