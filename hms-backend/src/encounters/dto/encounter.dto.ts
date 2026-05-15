import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { EncounterStatus } from '@prisma/client';

export class CreateEncounterDto {
  @IsUUID()
  patientId: string;

  @IsEnum(EncounterStatus)
  @IsOptional()
  status?: EncounterStatus;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateEncounterDto {
  @IsEnum(EncounterStatus)
  @IsOptional()
  status?: EncounterStatus;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
