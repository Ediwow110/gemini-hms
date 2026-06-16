import { IsString, IsOptional, IsEnum } from 'class-validator';

export class DashboardQueryDto {
  @IsString()
  @IsOptional()
  dateFrom?: string;

  @IsString()
  @IsOptional()
  dateTo?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['volume', 'revenue'])
  dimension?: 'volume' | 'revenue';
}
