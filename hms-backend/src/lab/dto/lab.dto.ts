import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ResultFlag {
  NORMAL = 'NORMAL',
  ABNORMAL = 'ABNORMAL',
  CRITICAL = 'CRITICAL',
}

export class LabResultItemDto {
  @IsString()
  @IsNotEmpty()
  testName: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  referenceRange?: string;

  @IsEnum(ResultFlag)
  @IsOptional()
  flag?: ResultFlag = ResultFlag.NORMAL;
}

export class EncodeLabResultDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabResultItemDto)
  items: LabResultItemDto[];

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ApproveLabResultDto {
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class AmendLabResultDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
