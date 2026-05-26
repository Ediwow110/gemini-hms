import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorService } from '../services/doctor.service';
import type { CreatePrescriptionPayload } from '../services/doctor.service';

export const usePatientList = (search?: string) => {
  return useQuery({
    queryKey: ['doctor', 'patients', search],
    queryFn: () => doctorService.getPatients(search),
    retry: false,
  });
};

export const usePatientPrescriptions = (patientId: string | undefined) => {
  return useQuery({
    queryKey: ['doctor', 'prescriptions', patientId],
    queryFn: () => doctorService.getPatientPrescriptions(patientId!),
    enabled: !!patientId,
    retry: false,
  });
};

export const useCreatePrescription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePrescriptionPayload) =>
      doctorService.createPrescription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'prescription-queue'] });
    },
  });
};
