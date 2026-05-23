export class PharmacyPrescriptionQueueDto {
  id: string;
  encounterId: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  status: string;
  version: number;
  prescribedAt: Date;
  prescribedBy: string;
  prescribedByName?: string;
  timestamp: Date;
  accessLabel: string = 'Pharmacy Queue';
  isReadOnly: boolean = true;
}

export class DispenseResultDto {
  id: string;
  status: string;
  version: number;
  dispensedById?: string;
  dispensedAt?: Date;
  medicationName: string;
  dosage: string;
  inventoryItemId?: string;
  quantity: number;
  timestamp: Date;
  accessLabel: string = 'Dispense Result';
  isReadOnly: boolean = true;
}
