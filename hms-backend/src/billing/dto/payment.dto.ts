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

export class LogReceiptEventDto {
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;

  @IsString()
  @IsNotEmpty()
  eventKey: string; // RECEIPT_PRINTED, RECEIPT_REPRINTED, RECEIPT_EXPORTED

  @IsString()
  @IsOptional()
  receiptNumber?: string;

  @IsString()
  @IsOptional()
  format?: string; // thermal, pdf, email

  @IsString()
  @IsOptional()
  reason?: string; // for reprints
}
