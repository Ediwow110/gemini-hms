import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';

export class CreateReferrerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @IsEnum(['DOCTOR', 'CLINIC', 'FACILITY'])
  type?: string;

  @IsString()
  @IsOptional()
  contactInfo?: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  rebateRate: number;
}

export class CreateReferralRecordDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsUUID()
  @IsNotEmpty()
  referrerId: string;

  @IsNumber()
  @Min(0)
  rebateAmount: number;
}

export class UpdateReferralRecordStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['PENDING', 'CONFIRMED', 'PAID', 'CANCELLED'])
  status: string;
}
