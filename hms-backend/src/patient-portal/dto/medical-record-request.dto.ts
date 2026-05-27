import { IsOptional, IsString, MaxLength, IsIn } from 'class-validator';

export class CreateMedicalRecordRequestDto {
  @IsOptional()
  @IsString()
  @IsIn(['FULL_RECORD', 'LAB_RESULTS_ONLY', 'ENCOUNTER_SUMMARY'])
  requestType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
