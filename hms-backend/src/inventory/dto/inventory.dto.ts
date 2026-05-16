import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  IsInt,
  NotEquals,
} from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  unitOfMeasure: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @IsNumber()
  @Min(0)
  price: number;
}

export class ReceiveStockDto {
  @IsString()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  referenceId?: string;
}

export class AdjustStockDto {
  @IsString()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsString()
  @IsOptional()
  stockBatchId?: string;

  @IsInt()
  @NotEquals(0)
  quantityChange: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  referenceId?: string;
}
