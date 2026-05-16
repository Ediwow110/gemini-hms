import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { EncounterStatus, NoteType } from '@prisma/client';

export class CreateEncounterDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  branchId: string;

  @IsUUID()
  @IsOptional()
  attendingId?: string;

  @IsEnum(EncounterStatus)
  @IsOptional()
  status?: EncounterStatus;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateEncounterStatusDto {
  @IsEnum(EncounterStatus)
  status: EncounterStatus;
}

export class CreateVitalsDto {
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(300)
  systolicBp?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(200)
  diastolicBp?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  heartRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(60)
  respiratory?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  weightKg?: number;
}

export class CreateDiagnosisDto {
  @IsString()
  icd10Code: string;

  @IsString()
  description: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class CreateClinicalNoteDto {
  @IsEnum(NoteType)
  noteType: NoteType;

  @IsString()
  content: string;
}
