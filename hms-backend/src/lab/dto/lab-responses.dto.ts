export class PendingSpecimenDto {
  id!: string;
  orderId!: string;
  orderNumber!: string;
  patientId!: string;
  patientName!: string;
  patientMrn!: string;
  specimenType!: string;
  collectionMode!: string;
  collectedAt?: string | null;
  status!: string;
  createdAt!: string;
  testNames?: string[];
}

export class ReleasableResultDto {
  id!: string;
  orderId!: string;
  orderNumber!: string;
  patientId!: string;
  patientName!: string;
  patientMrn!: string;
  status!: string;
  encodedById?: string | null;
  encodedAt?: string | null;
  validatedById?: string | null;
  validatedAt?: string | null;
  results?: any;
  remarks?: string | null;
  createdAt!: string;
  testNames?: string[];
}

export class ReleaseResultResponseDto {
  id!: string;
  status!: string;
  releasedAt!: string;
  releasedById!: string;
}

export class CriticalResultDto {
  id!: string;
  orderId!: string;
  orderNumber!: string;
  patientId!: string;
  patientName!: string;
  patientMrn!: string;
  testNames?: string[];
  results?: any;
  status!: string; // original lab result status
  isCritical!: boolean;
  criticalStatus!: string | null; // OPEN, ACKNOWLEDGED, ESCALATED, RESOLVED
  criticalAcknowledgedAt?: string | null;
  criticalAcknowledgedById?: string | null;
  criticalAcknowledgedByName?: string | null;
  criticalEscalatedAt?: string | null;
  criticalEscalatedById?: string | null;
  criticalEscalationNotes?: string | null;
  criticalResolvedAt?: string | null;
  criticalResolvedById?: string | null;
  criticalResolvedNotes?: string | null;
  encodedAt?: string | null;
  validatedAt?: string | null;
  releasedAt?: string | null;
  createdAt!: string;
}

export class AcknowledgeCriticalDto {
  notes?: string;
}

export class EscalateCriticalDto {
  notes!: string;
}
