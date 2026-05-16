import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
} from 'class-validator';

export enum ReportType {
  SALES = 'SALES',
  INVENTORY = 'INVENTORY',
  PATIENT_LIST = 'PATIENT_LIST',
}

export enum ExportFormat {
  CSV = 'CSV',
  PDF = 'PDF',
}

export class ExportReportDto {
  @IsEnum(ReportType)
  @IsNotEmpty()
  reportType: ReportType;

  @IsEnum(ExportFormat)
  @IsNotEmpty()
  format: ExportFormat;

  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class SalesSummaryQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
