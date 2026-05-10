import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

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
