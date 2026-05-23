import { IsInt, IsString, IsOptional, Min } from 'class-validator';

export class DispensePrescriptionDto {
  @IsInt()
  @Min(0)
  version: number;

  @IsString()
  inventoryItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
