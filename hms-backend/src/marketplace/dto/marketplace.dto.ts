import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { ListingStatus } from '@prisma/client';

export class CreateListingDto {
  @IsUUID()
  serviceItemId: string;

  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  priceOverride?: number;
}

export class UpdateListingDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  priceOverride?: number;

  @IsEnum(ListingStatus)
  @IsOptional()
  status?: ListingStatus;
}

export class ModerateListingDto {
  @IsEnum(ListingStatus)
  status: ListingStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class GetListingsQueryDto {
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateQuoteDto {
  @IsUUID()
  rfqId: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;
}
