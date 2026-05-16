import {
  IsNotEmpty,
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { RadiologyModality } from '@prisma/client';

export class CreateRadiologyOrderDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @IsNotEmpty()
  @IsEnum(RadiologyModality)
  modality: RadiologyModality;

  @IsOptional()
  @IsString()
  clinicalNotes?: string;
}
