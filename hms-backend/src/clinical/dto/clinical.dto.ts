import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateEncounterDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsString()
  chiefComplaint: string;
}

export class CreateClinicalNoteDto {
  @IsString()
  subjective: string;

  @IsString()
  objective: string;

  @IsString()
  assessment: string;

  @IsString()
  plan: string;
}

export class UpdateClinicalNoteDto {
  @IsOptional()
  @IsString()
  subjective?: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsString()
  assessment?: string;

  @IsOptional()
  @IsString()
  plan?: string;
}

export class AttachDiagnosisDto {
  @IsString()
  icd10Code: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
