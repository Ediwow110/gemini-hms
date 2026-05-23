import { IsInt, IsString, IsOptional, MaxLength, Min } from 'class-validator';

export class ValidateLabResultDto {
  @IsInt()
  @Min(0)
  version: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  remarks?: string;
}
