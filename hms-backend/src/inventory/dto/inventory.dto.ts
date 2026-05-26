import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
} from 'class-validator';

export enum InventoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsNotEmpty()
  category: string; // DRUG, SUPPLY, EQUIPMENT

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @Min(0)
  reorderLevel: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(InventoryStatus)
  @IsOptional()
  status?: InventoryStatus;
}

export class UpdateInventoryItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsEnum(InventoryStatus)
  @IsOptional()
  status?: InventoryStatus;
}

export class ReceiveStockDto {
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  supplierName?: string;
}

export class AdjustStockDto {
  @IsNumber()
  @Min(0)
  newQuantity!: number;

  @IsString()
  reason!: string;
}
