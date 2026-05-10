export class CreateApprovalRequestDto {
  type: string;
  riskLevel: string;
  recordId: string;
  reason?: string;
}

export class ProcessApprovalRequestDto {
  remarks?: string;
}
