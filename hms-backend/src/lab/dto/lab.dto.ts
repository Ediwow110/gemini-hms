import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';

export class EncodeLabResultDto {
  @IsObject()
  @IsNotEmpty()
  results: Record<string, any>; // Key-value pairs of test parameters and values

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ApproveLabResultDto {
  @IsString()
  @IsOptional()
  pathologistRemarks?: string;
}

export class AmendLabResultDto {
  @IsObject()
  @IsOptional()
  newResults?: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
