export type RadiologyOrderPhase = 'PENDING' | 'UPLOADED' | 'FINALIZED';
export type RadiologyOrderPriority = 'STAT' | 'ROUTINE';

export interface RadiologyOrderDto {
  id: string;
  orderNumber: string;
  patientName: string;
  procedure: string;
  priority: RadiologyOrderPriority;
  /** Always PENDING until radiology report/upload persistence exists. */
  phase: RadiologyOrderPhase;
  requestedAt: string;
}