import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateClaimDto {
  @IsUUID()
  @IsNotEmpty()
  hmoPartnerId: string;

  @IsUUID()
  @IsNotEmpty()
  invoiceId: string;

  @IsString()
  @IsNotEmpty()
  loaNumber: string;

  @IsNumber()
  @Min(0.01)
  amountClaimed: number;
}

export class UpdateClaimStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string; // SUBMITTED, APPROVED, DENIED, PAID

  @IsNumber()
  @IsOptional()
  amountApproved?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
