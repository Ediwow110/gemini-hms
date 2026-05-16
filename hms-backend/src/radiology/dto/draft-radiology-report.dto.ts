import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class DraftRadiologyReportDto {
  @IsNotEmpty()
  @IsString()
  findings: string;

  @IsNotEmpty()
  @IsString()
  conclusion: string;

  @IsOptional()
  @IsString()
  dicomStudyUid?: string;
}
