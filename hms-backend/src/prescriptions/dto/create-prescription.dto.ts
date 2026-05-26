import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreatePrescriptionDto {
  @IsUUID()
  patientId!: string;

  @IsUUID()
  encounterId!: string;

  @IsString()
  @IsNotEmpty()
  medicationName!: string;

  @IsString()
  @IsNotEmpty()
  dosage!: string;

  @IsString()
  @IsNotEmpty()
  frequency!: string;

  @IsString()
  @IsNotEmpty()
  duration!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
