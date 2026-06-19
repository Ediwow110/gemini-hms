import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FinalizeRadiologyReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  interpretation: string;
}