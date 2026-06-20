export interface WorklistPatientDto {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dob: string;
  allergies?: string;
}

export interface WorklistEntryDto {
  id: string;
  queueNumber: string;
  status: string;
  serviceType: string;
  patientId: string | null;
  encounterId: string | null;
  patient: WorklistPatientDto | null;
}
