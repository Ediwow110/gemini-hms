import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { EmployeeStatus } from '@prisma/client';

export class CreateEmployeeDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsNotEmpty()
  employeeIdNumber: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @IsDateString()
  @IsNotEmpty()
  hireDate: string;

  @IsNumber()
  @Min(0)
  salary: number;
}

export class UpdateEmployeeStatusDto {
  @IsEnum(EmployeeStatus)
  @IsNotEmpty()
  status: EmployeeStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ClockInDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;
}
