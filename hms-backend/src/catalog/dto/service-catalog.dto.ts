import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
} from 'class-validator';

export enum ServiceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;
}

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;
}
