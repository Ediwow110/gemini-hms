import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePatientMergeRequestDto {
  @IsUUID()
  @IsNotEmpty()
  sourcePatientId: string;

  @IsUUID()
  @IsNotEmpty()
  targetPatientId: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  reason: string;
}

export class ApproveMergeRequestDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  remarks?: string;
}

export class RejectMergeRequestDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  reason: string;
}
