import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class JoinQueueDto {
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsUUID()
  @IsOptional()
  patientId?: string;

  @IsString()
  @IsOptional()
  patientName?: string;

  @IsString()
  @IsNotEmpty()
  serviceType: string; // RECEPTION, CASHIER, LABORATORY, DOCTOR

  @IsString()
  @IsOptional()
  category?: string; // REGULAR, PRIORITY, EMERGENCY
}

export class UpdateQueueStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string; // CALLING, SERVING, COMPLETED, CANCELLED

  @IsString()
  @IsOptional()
  counterNumber?: string;
}
