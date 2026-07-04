import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsInt,
  IsNumber,
} from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class CreatePurchaseRequestDto {
  @IsUUID()
  branchId: string;

  @IsArray()
  items: any[];

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  branchId: string;

  @IsUUID()
  purchaseRequestId: string;

  @IsUUID()
  supplierId: string;
}

export class ReceivePurchaseOrderDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRFQDto {
  @IsUUID()
  itemId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  warrantyTier?: string;

  @IsOptional()
  @IsString()
  siteReadinessDetails?: string;

  @IsOptional()
  @IsString()
  leasingOption?: string;
}
