export type RadiologyOrderPhase = 'PENDING' | 'UPLOADED' | 'FINALIZED';
export type RadiologyOrderPriority = 'STAT' | 'ROUTINE';

export interface RadiologyOrderDto {
  id: string;
  orderNumber: string;
  patientName: string;
  procedure: string;
  priority: RadiologyOrderPriority;
  phase: RadiologyOrderPhase;
  requestedAt: string;
  interpretation?: string;
  finalizedAt?: string;
}

export interface RadiologyReportFinalizeResponseDto {
  id: string;
  orderId: string;
  interpretation: string;
  status: string;
  finalizedAt: string;
}