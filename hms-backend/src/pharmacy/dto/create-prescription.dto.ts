import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PrescriptionItemDto {
  @IsNotEmpty()
  @IsUUID()
  medicationId: string;

  @IsNotEmpty()
  @IsString()
  dosage: string;

  @IsNotEmpty()
  @IsString()
  frequency: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  durationDays: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantityPrescribed: number;
}

export class CreatePrescriptionDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsNotEmpty()
  @IsUUID()
  encounterId: string;

  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];
}
