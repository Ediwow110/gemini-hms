import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export enum AcuityLevel {
  RED = 'RED',
  ORANGE = 'ORANGE',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
  BLUE = 'BLUE',
}

export class SaveTriageDto {
  @IsOptional()
  @IsEnum(AcuityLevel)
  acuityLevel?: AcuityLevel;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  chiefComplaintSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  arrivalMode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  painScore?: number;

  @IsOptional()
  @IsBoolean()
  infectiousRiskFlag?: boolean;

  @IsOptional()
  @IsBoolean()
  fallRiskFlag?: boolean;

  @IsOptional()
  @IsBoolean()
  pregnancyFlag?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
