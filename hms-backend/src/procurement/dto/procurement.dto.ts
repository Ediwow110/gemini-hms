import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class PurchaseRequestItemDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreatePurchaseRequestDto {
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseRequestItemDto)
  items: PurchaseRequestItemDto[];

  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsUUID()
  @IsNotEmpty()
  supplierId: string;

  @IsUUID()
  @IsNotEmpty()
  purchaseRequestId: string;
}

export class ReceivePurchaseOrderDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
