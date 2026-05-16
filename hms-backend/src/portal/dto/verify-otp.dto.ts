import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @IsNotEmpty()
  @IsString()
  patientNumber: string;

  @IsNotEmpty()
  @IsString()
  otpCode: string;
}
