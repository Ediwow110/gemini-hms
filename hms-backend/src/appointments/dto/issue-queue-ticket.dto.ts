import { IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class IssueQueueTicketDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;
}
