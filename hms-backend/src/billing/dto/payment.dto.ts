import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  IsString,
  IsOptional,
  IsIn,
  MaxLength,
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

  @IsIn(['CASH', 'CARD', 'GCASH', 'QRPH', 'BANK_TRANSFER'])
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
  @MaxLength(500)
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

export class ConfirmPaymentDto {
  @IsString()
  @IsNotEmpty()
  gatewayReference: string;

  @IsString()
  @IsOptional()
  gatewayProvider?: string; // defaults to 'QRPH' if not set
}

export class FailPaymentDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  gatewayReference?: string;
}

export class ExpirePaymentDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
