import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResultFlag } from '@prisma/client';

export class CreateLabResultItemDto {
  @IsString()
  testName: string;

  @IsString()
  value: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  referenceRange?: string;

  @IsEnum(ResultFlag)
  @IsOptional()
  flag?: ResultFlag;
}

export class EncodeResultDto {
  @IsUUID()
  specimenId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLabResultItemDto)
  items: CreateLabResultItemDto[];

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class AmendResultDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLabResultItemDto)
  items: CreateLabResultItemDto[];

  @IsString()
  reasonForAmendment: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
