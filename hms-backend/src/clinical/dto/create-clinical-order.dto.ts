import {
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  ArrayMinSize,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClinicalOrderItemDto {
  @IsString({ message: 'itemName must be a string' })
  @MaxLength(200, { message: 'itemName must be at most 200 characters' })
  itemName: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'catalogCode must be at most 200 characters' })
  catalogCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'item notes must be at most 500 characters' })
  notes?: string;
}

export class CreateClinicalOrderDto {
  @IsEnum(['LAB', 'IMAGING', 'PROCEDURE', 'SERVICE'], {
    message: 'orderType must be one of: LAB, IMAGING, PROCEDURE, SERVICE',
  })
  orderType: string;

  @IsOptional()
  @IsEnum(['ROUTINE', 'URGENT', 'STAT'], {
    message: 'priority must be one of: ROUTINE, URGENT, STAT',
  })
  priority?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'clinicalIndication must be at most 500 characters',
  })
  clinicalIndication?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'at least one order item is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateClinicalOrderItemDto)
  items: CreateClinicalOrderItemDto[];
}
