import { IsUUID, IsEnum, IsOptional, IsString } from 'class-validator';
import { LabOrderPriority, SpecimenStatus } from '@prisma/client';

export class CreateLabOrderDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  @IsOptional()
  encounterId?: string;

  @IsUUID()
  orderingPhysicianId: string;

  @IsEnum(LabOrderPriority)
  @IsOptional()
  priority?: LabOrderPriority;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateSpecimenDto {
  @IsString()
  barcode: string;

  @IsString()
  specimenType: string;
}

export class UpdateSpecimenStatusDto {
  @IsEnum(SpecimenStatus)
  status: SpecimenStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
