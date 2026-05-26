export class PrescriptionResponseDto {
  id!: string;
  patientId!: string;
  encounterId!: string;
  medicationName!: string;
  dosage!: string;
  frequency!: string;
  duration!: string;
  notes?: string;
  status!: string;
  prescribedById?: string;
  prescribedByName?: string;
  createdAt!: Date;
}
