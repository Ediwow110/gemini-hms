import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  IsString,
  IsOptional,
} from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  invoiceId: string;

  @IsUUID()
  @IsNotEmpty()
  cashierSessionId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // CASH, CARD, GCASH, etc.
}

export class OpenSessionDto {
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsNumber()
  @Min(0)
  openingBalance: number;
}

export class CloseSessionDto {
  @IsNumber()
  @Min(0)
  actualClosingBalance: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
