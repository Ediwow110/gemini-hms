import { IsEmail, IsString } from 'class-validator';

export class PatientLoginDto {
  @IsString()
  tenantCode: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
