import { IsNotEmpty, IsUUID, IsNumber, Min, IsString } from 'class-validator';

export class RefundRequestDto {
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class VoidRequestDto {
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
