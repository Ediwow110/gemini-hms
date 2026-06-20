import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

export class CreateEmployeeDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsDateString()
  @IsNotEmpty()
  hireDate: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  salary?: number;
}

export class UpdateEmployeeStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED'])
  status: string;
}

export class CreateLeaveRequestDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class CreateLicenseRecordDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  licenseType: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @IsDateString()
  @IsNotEmpty()
  issuedAt: string;

  @IsDateString()
  @IsNotEmpty()
  expiresAt: string;
}

export class CreatePayslipDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @IsDateString()
  @IsNotEmpty()
  periodStart: string;

  @IsDateString()
  @IsNotEmpty()
  periodEnd: string;

  @IsNumber()
  @Min(0)
  totalAllowances: number;

  @IsNumber()
  @Min(0)
  totalDeductions: number;
}

export class ListPayslipsFiltersDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsUUID()
  @IsOptional()
  employeeId?: string;
}
