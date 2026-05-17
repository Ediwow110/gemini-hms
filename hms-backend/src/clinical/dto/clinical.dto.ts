import { IsString, IsUUID, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ReferralUrgency, ReferralStatus } from '@prisma/client';

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

export class CreatePrescriptionDto {
  @IsString()
  medicationName: string;

  @IsString()
  dosage: string;

  @IsString()
  frequency: string;

  @IsString()
  duration: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateReferralDto {
  @IsString()
  referredToName: string;

  @IsString()
  specialty: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsEnum(ReferralUrgency)
  urgency?: ReferralUrgency;
}

export class UpdateReferralStatusDto {
  @IsEnum(ReferralStatus)
  status: ReferralStatus;
}

