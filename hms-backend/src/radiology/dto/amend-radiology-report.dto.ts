import { IsNotEmpty, IsString } from 'class-validator';

export class AmendRadiologyReportDto {
  @IsNotEmpty()
  @IsString()
  findings: string;

  @IsNotEmpty()
  @IsString()
  conclusion: string;

  @IsNotEmpty()
  @IsString()
  reasonForAmendment: string;
}
