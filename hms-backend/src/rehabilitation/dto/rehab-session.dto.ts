export class RehabSessionDto {
  tenantId!: string;
  patientId!: string;
  deviceId!: string;
  accuracyRate!: number; // M_accuracy (0.0 to 1.0)
  targetLatency!: number; // T_target
  actualLatency!: number; // T_response
  isSessionAborted?: boolean; // Signal to simulate hardware dropout mid-session
}
