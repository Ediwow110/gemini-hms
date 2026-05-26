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
