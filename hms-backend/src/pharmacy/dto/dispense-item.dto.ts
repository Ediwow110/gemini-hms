import { IsNotEmpty, IsInt, Min, IsUUID } from 'class-validator';

export class DispenseItemDto {
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;
}
