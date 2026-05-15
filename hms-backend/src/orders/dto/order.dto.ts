import {
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderItemType {
  SERVICE = 'SERVICE',
  INVENTORY = 'INVENTORY',
}

class OrderItemDto {
  @IsEnum(OrderItemType)
  @IsNotEmpty()
  itemType: OrderItemType;

  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  /**
   * Price is now ignored for calculations.
   * Accepted for backward compatibility if needed, but the server will
   * ALWAYS fetch the trusted price from the catalog/inventory.
   */
  @IsNumber()
  @Min(0)
  price?: number;
}

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
